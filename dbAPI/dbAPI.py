from copy import deepcopy

from flask import Flask
from flask import request
from flask import jsonify

import os

import psycopg2
from psycopg2 import extensions

from dotenv import load_dotenv

import uuid
from uuid import uuid4
import hashlib


import googlemaps
import requests
import json
import re
import polyline
import time
from math import sin, cos, sqrt, atan2, radians

import pandas as pd

from surprise import Dataset
from surprise import accuracy
from surprise.model_selection import train_test_split
from surprise import Reader
from surprise import SVD

import requests
import json


app = Flask(__name__)
load_dotenv()

key = os.getenv('APIKEY')
print(key)
gmaps = googlemaps.Client(key=key)
radius = 100
dsn = os.getenv('ROACH_CMD')


# Create a user
# Parameters:
# email: primary key
# password: password for account
@app.route("/users/createUsers", methods=['POST'])
def createUsers():
    content = request.json

    password = content.get("password")

    rowcount = -1

    # Create salt for password, then hash password
    if password is not None:
        salt = uuid4().bytes
        storeSalt = uuid.UUID(bytes=salt).int  # Can be stored in database, equal to salt
        passwordBytes = password.encode('utf-8')
        dk1 = hashlib.pbkdf2_hmac('sha256', passwordBytes, salt, 100000)

        params = {
            'email': content.get("email"),
            'password': dk1.hex(),
            'salt': str(storeSalt),
            'id': str(uuid4().int)
        }

        conn = psycopg2.connect(dsn)

        with conn.cursor() as cur:
            try:
                cur.execute("""
                        INSERT INTO users (email, password, salt, id)
                        VALUES (%(email)s, %(password)s, %(salt)s, %(id)s)
                        """, params)
            except psycopg2.Error as error:
                print(error)

            rowcount = cur.rowcount
        conn.commit()

    if rowcount > -1:
        return "true"
    else:
        return "false"


# Parameters
# email: user's email where the password is stored
# password: password to check against DB password
@app.route("/users/checkPass", methods=['GET'])
def checkPass():
    email = request.args.get('email')
    password = request.args.get('password')

    conn = psycopg2.connect(dsn)

    log = "false"

    with conn.cursor() as cur:
        try:
            cur.execute("""
            SELECT password, salt FROM users
            WHERE email = %(email)s
            """, {'email': email})
            returnRows = cur.fetchall()
            conn.commit()

            pass1 = None
            salt = None

            for row in returnRows:
                pass1 = row[0]
                salt = row[1]

            if password is not None and salt is not None:
                salt = int(salt)
                salt = uuid.UUID(int=salt, version=4).bytes

                # convert passed password to bytes
                passwordBytes = password.encode('utf-8')

                # rehash to check against db
                dk = hashlib.pbkdf2_hmac('sha256', passwordBytes, salt, 100000)

                # convert recomputed hash to string for comparison
                hexCompare = dk.hex().__str__()

                if hexCompare == pass1:
                    log = "true"

        except psycopg2.Error as error:
            print(error)

    return log


# Add a list of interests to a user on submit button press
# Parameters:
# email: the user's email (used to find userID)
# interests: a JSON object with interest as key and rating as value
@app.route("/interests/addInterests", methods=["POST"])
def addInterests():
    content = request.json

    email = content.get('email')
    emailDict = {'email': email}
    interestDict = content.get("interests")
    newInterests = deepcopy(interestDict)
    updateInterests = {}

    if interestDict is not None and email is not None:
        # Query each element against table
        conn = psycopg2.connect(dsn)
        with conn.cursor() as cur:
            userID = 0
            try:
                cur.execute("""
                            SELECT id FROM users
                            WHERE email = %(email)s
                            """, emailDict)
                conn.commit()
                rowList = cur.fetchall()
                for row in rowList:
                    userID = row[0]

            except psycopg2.Error as error:
                print(error)

            if userID != 0:
                for key in interestDict:
                    keyDict = {'activity': key}
                    try:
                        cur.execute("""
                                    SELECT activity, activityID FROM interests
                                    WHERE activity = %(activity)s
                                    """, keyDict)
                        conn.commit()
                        rowList = cur.fetchall()
                        for row in rowList:
                            updateInterests[row[1]] = interestDict[row[0]]
                            newInterests.pop(row[0])

                    except psycopg2.Error as error:
                        print(error)

                for key in newInterests:
                    interestID = uuid4().int
                    keyDict = {'activityid': str(interestID), 'activity': key}
                    updateInterests[str(interestID)] = newInterests[key]

                    try:
                        cur.execute("""
                                    INSERT INTO interests (activityid, activity) VALUES (%(activityid)s, %(activity)s)
                                    """, keyDict)
                        conn.commit()

                    except psycopg2.Error as error:
                        print(error)

                for key in updateInterests:
                    keyDict = {
                        'userid': userID,
                        'activityid': key,
                        'rating': updateInterests[key]
                    }
                    try:
                        #cur.execute("""
                        #UPSERT INTO activityratings(userid, activityid, rating) VALUES(%(userid)s, %(activityid)s, %(rating)s);
                        #""", keyDict)
                        cur.execute("""
                        SELECT * FROM activityratings WHERE userid=%(userid)s AND activityid=%(activityid)s
                        """, keyDict)
                        rowList = cur.fetchall()
                        if len(rowList) > 0:
                            try:
                                cur.execute("""
                                UPDATE activityratings
                                SET rating=%(rating)s
                                WHERE userID=%(userid)s AND activityid=%(activityid)s
                                """, keyDict)
                            except psycopg2.Error as error:
                                print(error)
                        else:
                            try:
                                cur.execute("""
                                INSERT INTO activityratings (userid, activityid, rating) 
                                VALUES(%(userid)s, %(activityid)s, %(rating)s);
                                """, keyDict)
                            except psycopg2.Error as error:
                                print(error)

                        conn.commit()
                    except psycopg2.Error as error:
                        print(error)

    return "true"


# Push a rated location to the database
# Updates the location's ratings if it has already been rated
# Parameters:
# email: User submitting the rating
# placeID: the Google Place ID of the place (should be unique to it)
# userRating: the User's rating of the place
# googleRating: the Google's rating of the place
@app.route("/locations/rateLocation", methods=["POST"])
def rateLocation():
    content = request.json

    placeID = content.get("placeID")
    email = content.get("email")
    emailDict = {'email': email}
    userRating = content.get("userRating")
    googleRating = content.get("googleRating")

    params = {
        'email': email,
        'placeID': placeID,
        'userRating': userRating,
        'googleRating': googleRating
    }

    if placeID is not None and email is not None and userRating is not None and googleRating is not None:
        conn = psycopg2.connect(dsn)
        with conn.cursor() as cur:
            userID = 0
            rowID = 0
            try:
                cur.execute("""
                    SELECT id FROM users
                    WHERE email = %(email)s
                    """, emailDict)
                conn.commit()
                rowList = cur.fetchall()
                for row in rowList:
                    userID = row[0]

            except psycopg2.Error as error:
                print(error)

            if userID != 0:
                try:
                    cur.execute("""
                        SELECT rowid FROM locations
                        WHERE useremail = %(email)s
                        AND placeid = %(placeID)s
                        """, params)
                    conn.commit()
                    rowList = cur.fetchall()
                    for row in rowList:
                        rowID = row[0]

                    if rowID != 0:
                        params['rowid'] = rowID
                        try:
                            cur.execute("""
                                UPDATE locations
                                SET useremail=%(email)s, placeid=%(placeID)s, placeRating=%(userRating)s, googlerating=%(googleRating)s
                                WHERE rowid = %(rowid)s
                                """, params)
                            conn.commit()

                        except psycopg2.Error as error:
                            print(error)
                    else:
                        try:
                            cur.execute("""
                                INSERT INTO locations (placeid, useremail, placeRating, googlerating)
                                VALUES(%(placeID)s, %(email)s, %(userRating)s, %(googleRating)s);
                                """, params)
                            conn.commit()

                        except psycopg2.Error as error:
                            print(error)

                except psycopg2.Error as error:
                    print(error)
    return "true"


@app.route("/trips/createTrip", methods=["POST"])
def createTrip():
    content = request.json

    tripID = str(uuid4().int)
    userEmail = content.get('userEmail')
    emailDict = {'email': userEmail}
    numPlaces = content.get('numPlaces')
    originCity = content.get('originCity')
    destCity = content.get('destCity')

    #list_of_interests = ['lake', 'lake', 'hiking']

    interestIDs = {}
    interestNames = {}
    retVal = {}

    if userEmail is not None and numPlaces is not None and originCity is not None and destCity is not None:
        conn = psycopg2.connect(dsn)
        userid = ""
        with conn.cursor() as cur:
            try:
                cur.execute("""
                        SELECT id FROM users WHERE email=%(email)s
                        """, emailDict)
                conn.commit()
                retVal = cur.fetchall()

                if len(retVal) > 0:
                    userid = str(retVal[0][0])

            except psycopg2.Error as error:
                print(error)

        # from DB get all the activites that they did NOT rate (everything that's NULL)
        # put them in a list called listToSuggest
        if userid != "":
            useridDict = {'userid': userid}
            with conn.cursor() as cur:
                try:
                    cur.execute("""
                            SELECT activityid, rating FROM activityratings 
                            WHERE userid=%(userid)s AND rating IS NOT NULL
                            """, useridDict)
                    conn.commit()
                    retVal = cur.fetchall()

                    for row in retVal:
                        interestIDs[row[0]] = row[1]

                except psycopg2.Error as error:
                    print(error)
                for activityid in interestIDs:
                    activityidDict = {'activityid': activityid}
                    try:
                        cur.execute("""
                                SELECT activity FROM interests
                                WHERE activityid=%(activityid)s
                                """, activityidDict)
                        conn.commit()
                        retVal = cur.fetchall()

                        suggestedDict = {}

                        for row in retVal:
                            interestNames[row[0]] = interestIDs[activityid]

                    except psycopg2.Error as error:
                        print(error)

        #print(interestIDs)
        #print(interestNames)

        sortedDict = sorted(interestNames.items(), key=lambda x: x[1])

        list_of_interests = []
        priorityInterests = []

        for tuple in sortedDict:
            list_of_interests.insert(0, tuple[0])
        priorityInterests = list_of_interests[0:numPlaces]
        #print(sortedDict)
        #print(list_of_interests)
        print(priorityInterests)

        retVal = getJsonObject(priorityInterests, originCity, destCity, numPlaces)

    return jsonify(retVal)


def getJsonObject(interests, startLocation, endLocation, numStops):
    # location = (42.25561625552364, -121.78218779244243) # need to change this to the users current location somehow
    # getLocationForStop(location, 10)
    # getRouteJSON("5555 Highway 234, Central Point, OR", "3205 Campus Dr, Klamath Falls, OR")

    jsonObj = getRoutePointsOfInterest(startLocation, endLocation, numStops, interests)

    return jsonObj


def calcScore(price, rating, like_percentage, is_open):
    if (is_open == True or is_open == None):
        if (price == -1):
            price = 1
        if (rating == -1):
            rating = 2.5
        if (rating >= 4.8):
            rating = 4
        score = (price * (rating * like_percentage) / 5)
    else:
        score = 0
    return score


def getLocationForStop(searchstr, location, radius):
    searchstr.replace(' ', '+')
    req_str = "https://maps.googleapis.com/maps/api/place/textsearch/json?query=" + searchstr
    req_str += "&location=" + str(location[0]) + "," + str(location[1])
    req_str += "&radius=" + str(radius)
    req_str += "&key=" + key
    # print(req_str)
    # places_result = gmaps.places(searchstr, location=location, radius=radius)
    places_result = requests.get(req_str).json()
    # Get reviews
    print (places_result)
    with open('data.json', 'w', encoding='utf-8') as f:
        json.dump(places_result, f, ensure_ascii=False, indent=4)

    place_idList = [places_result['results'][x]["place_id"] for x in range(len(places_result['results']))]

    big_dict = []
    # best_to_worse = []
    highest_score = -1
    like_percentage = 1
    #url = 'https://maps.googleapis.com/maps/api/place/details/json?place_id=' + place_idList[0] + '&key=' + key
    #req = requests.get(url).json()
    print(place_idList)
    url = 'https://maps.googleapis.com/maps/api/place/details/json?place_id=' + place_idList[0] + '&key=' + key
    req = requests.get(url).json()
    keeper = req
    for place_id in place_idList:
        url = 'https://maps.googleapis.com/maps/api/place/details/json?place_id=' + place_id + '&key=' + key
        req = requests.get(url).json()
        big_dict.append(req)
        try:
            price = req['result']['price_level']
        except:
            price = -1
        try:
            rating = req['result']['rating']
        except:
            rating = -1
        try:
            is_open = req['result']['opening_hours']['open_now']
        except:
            is_open = None
        """try:
            name = req['result']['name']
        except:
            name = "Could not get name"
        """
        if (highest_score < calcScore(price, rating, like_percentage, is_open)):
            highest_score = calcScore(price, rating, like_percentage, is_open)
            keeper = req

        # print("Name: " + name + " Price(1 - 4): " + str(price) + " Rating(0.0 - 5.0): " + str(rating) + " Is Open: " + str(is_open))
        # print("Overall Rank Value: " + str(calcScore(price, rating, like_percentage, is_open)) + "\n")
        # print(r)
    with open('data_reviews.json', 'w', encoding='utf-8') as f:
        json.dump(big_dict, f, ensure_ascii=False, indent=4)
    with open('best_fit_location.json', 'w', encoding='utf-8') as f:
        json.dump(keeper, f, ensure_ascii=False, indent=4)
    # print("Keeper address: " + keeper['result']['formatted_address'] + "\n")


def getRouteJSON(origin, destination):
    url = 'https://maps.googleapis.com/maps/api/directions/json?'
    url += 'origin=' + origin + '&destination=' + destination
    url += '&key=' + key
    req = requests.get(url).json()
    with open('route.json', 'w', encoding='utf-8') as f:
        json.dump(req, f, ensure_ascii=False, indent=4)
    # print("Dumped Route JSON")


def getRoutePointsOfInterest(origin, destination, numOfStops, list_of_interests):
    # open route json
    getRouteJSON(origin, destination)
    with open('route.json') as f:
        route = json.load(f)
    # get total distnace of trip
    total_distance = re.findall(r"[-+]?\d*\.\d+|\d+", route['routes'][0]['legs'][0]['distance']['text'])
    # do the calculations here to get the POI (points of interest)
    # Need to do (numOfStops+1) because if not +1 the final stop is counted as a stop
    distance_between_poi = float(total_distance[0]) / (numOfStops + 1)
    # print(distance_between_poi)
    # distance since the last stop so we know that we need to get a new POI
    distance_since_last_stop = 0
    route_coords_list = polyline.decode(route['routes'][0]['overview_polyline']['points'])
    # print(len(route_coords_list))
    start_coords = route_coords_list[0]
    end_coords = route_coords_list[len(route_coords_list) - 1]
    # print(start_coords)
    # print(end_coords)

    # print(len(route_coords_list))
    # print(distanceBetweenPoints(*route_coords_list[0], *route_coords_list[1]))
    poi_coords = []
    poi_names = []
    cur_stop_num = 0
    for x in range(len(route_coords_list) - 1):
        distance_since_last_stop += distanceBetweenPoints(*route_coords_list[x], *route_coords_list[x + 1])

        if (distance_since_last_stop >= distance_between_poi):
            # print("CORDS OF PLACE IM AT")
            # print(route_coords_list[x])
            getLocationForStop(list_of_interests[cur_stop_num], route_coords_list[x], radius)
            cur_stop_num += 1
            with open('best_fit_location.json', encoding="utf8") as f:
                best_location = json.load(f)
            coords = (best_location['result']['geometry']['location']['lat'],
                      best_location['result']['geometry']['location']['lng'])
            poi_coords.append(coords)
            poi_names.append(best_location['result']['name'])
            distance_since_last_stop = 0

    # gen new route polyline here
    # print(poi_coords)
    new_route = []
    req = getDirectionsReq(start_coords[0], start_coords[1], poi_coords[0][0], poi_coords[0][1])
    # print(req)
    new_route = (polyline.decode(req['routes'][0]['overview_polyline']['points']))
    for x in range(len(poi_coords) - 1):
        req = getDirectionsReq(poi_coords[x][0], poi_coords[x][1], poi_coords[x + 1][0], poi_coords[x + 1][1])
        subroute = polyline.decode(req['routes'][0]['overview_polyline']['points'])
        for i in range(len(subroute)):
            new_route.append(subroute[i])

    req = getDirectionsReq(poi_coords[len(poi_coords) - 1][0], poi_coords[len(poi_coords) - 1][1], end_coords[0],
                           end_coords[1])
    subroute = polyline.decode(req['routes'][0]['overview_polyline']['points'])
    for i in range(len(subroute)):
        new_route.append(subroute[i])

    file1 = open("polyline.json", "w")
    file1.write("{\n\t\"coords\": [\n")
    for i in range(len(new_route)):
        # print("{ \"lat\": " + str(new_route[i][0]) + ", \"lng\": " + str(new_route[i][1]) + " }")
        if (i != len(new_route) - 1):
            file1.write("\t{ \"lat\": " + str(new_route[i][0]) + ", \"lng\": " + str(new_route[i][1]) + " },\n")
        else:
            file1.write("\t{ \"lat\": " + str(new_route[i][0]) + ", \"lng\": " + str(new_route[i][1]) + " }\n")
    file1.write("\t],\n")
    file1.write("\t\"markers\": [\n")
    file1.write("\t{ \"lat\": " + str(start_coords[0]) + ", \"lng\": " + str(start_coords[1]) + " },\n")
    for i in range(len(poi_coords)):
        file1.write("\t{ \"lat\": " + str(poi_coords[i][0]) + ", \"lng\": " + str(poi_coords[i][1]) + " },\n")
    file1.write("\t{ \"lat\": " + str(end_coords[0]) + ", \"lng\": " + str(end_coords[1]) + " }\n")
    file1.write("\t],\n")
    file1.write("\t\"marker_names\": [\n")
    file1.write("\t{ \"name\": " + "\"Start\"" + " },\n")
    for i in range(len(poi_coords)):
        file1.write("\t{ \"name\": \"" + poi_names[i] + "\" },\n")
    file1.write("\t{ \"name\": " + "\"End\"" + " }\n")
    file1.write("\t]\n}")
    file1.close()

    retVal = {}
    with open('polyline.json') as jsonFile:
        retVal = json.load(jsonFile)

    file1 = open("encoded_polyline.txt", "w")
    file1.write(polyline.encode(new_route))
    file1.close()

    return retVal
    # print(new_route)
    # print(polyline.encode(new_route))


def getDirectionsReq(origLat, origLang, destLat, destLang):
    url = 'https://maps.googleapis.com/maps/api/directions/json?'
    url += 'origin=' + str(origLat) + "," + str(origLang) + '&destination=' + str(destLat) + "," + str(destLang)
    url += '&key=' + key
    return (requests.get(url).json())


def distanceBetweenPoints(lat1, lon1, lat2, lon2):
    # approximate radius of earth in miles
    R = 6373.0

    lat1 = radians(lat1)
    lon1 = radians(lon1)
    lat2 = radians(lat2)
    lon2 = radians(lon2)

    dlon = lon2 - lon1
    dlat = lat2 - lat1

    a = sin(dlat / 2) ** 2 + cos(lat1) * cos(lat2) * sin(dlon / 2) ** 2
    c = 2 * atan2(sqrt(a), sqrt(1 - a))

    return (R * c * 0.62137)

# Parameters:
# email: user's email
@app.route("/ml/suggest", methods=["GET"])
def suggest():
    email = request.args.get('email')
    emailDict = {'email': email}

    df = pd.read_sql_table("activityratings", os.getenv('ROACH_CMD2')).dropna()

    reader = Reader(rating_scale=(1, 5))
    data = Dataset.load_from_df(df[df.columns.tolist()], reader)
    trainset, testset = train_test_split(data, test_size=0.20)

    model = SVD()
    model.fit(trainset)
    predictions = model.test(testset)

    listToSuggest = []
    suggestedList = []

    #userid should be stored here
    if email is not None:
        conn = psycopg2.connect(dsn)
        userid = ""
        with conn.cursor() as cur:
            try:
                cur.execute("""
                    SELECT id FROM users WHERE email=%(email)s
                    """, emailDict)
                conn.commit()
                retVal = cur.fetchall()

                if len(retVal) > 0:
                    userid = str(retVal[0][0])

            except psycopg2.Error as error:
                print(error)


        # from DB get all the activites that they did NOT rate (everything that's NULL)
        # put them in a list called listToSuggest
        if userid != "":
            useridDict = {'userid': userid}
            with conn.cursor() as cur:
                try:
                    cur.execute("""
                        SELECT activityid FROM activityratings 
                        WHERE userid=%(userid)s AND rating IS NULL
                        """, useridDict)
                    conn.commit()
                    retVal = cur.fetchall()

                    for row in retVal:
                        listToSuggest.append(row[0])

                except psycopg2.Error as error:
                    print(error)

                for activityid in listToSuggest:
                    pred = model.predict(userid, activityid)
                    predRating = pred.est
                    if predRating > 2.6:
                        activityidDict = {'activityid': activityid}
                        try:
                            cur.execute("""
                                SELECT activity FROM interests
                                WHERE activityid=%(activityid)s
                                """, activityidDict)
                            conn.commit()
                            retVal = cur.fetchall()

                            suggestedDict = {}

                            for row in retVal:
                                suggestedList.append(row[0])

                        except psycopg2.Error as error:
                            print(error)

    return jsonify(suggestedList)

@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type')
    return response

if __name__ == "__main__":
    app.run()
