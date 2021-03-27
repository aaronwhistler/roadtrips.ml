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

app = Flask(__name__)
load_dotenv()

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
                        cur.execute("""
                        UPSERT INTO activityratings(userid, activityid, rating) VALUES(%(userid)s, %(activityid)s, %(rating)s);
                        """, keyDict)
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
    numPlaces = content.get('numPlaces')
    placeIDs = content.get('placeIDs')
    tripLength = content.get('tripLength')
    originCity = content.get('originCity')
    destCity = content.get('destCity')
    userReview = content.get('userReview')
    googleReview = content.get('googleReview')

    params = {
        'tripID': tripID,
        'userEmail': userEmail,
        'numPlaces': numPlaces,
        'placeIDs': placeIDs,
        'tripLength': tripLength,
        'originCity': originCity,
        'destCity': destCity,
        'userReview': userReview,
        'googleReview': googleReview
    }

    for key in params:
        if params[key] is None:
            return "false"

    conn = psycopg2.connect(dsn)
    with conn.cursor() as cur:
        try:
            cur.execute("""
            INSERT INTO trips (tripid, useremail, numplaces, placeids, triplength, origincity, destcity, userreview, googlereview)
             VALUES (%(tripID)s, %(userEmail)s, %(numPlaces)s, %(placeIDs)s,
              %(tripLength)s, %(originCity)s, %(destCity)s, %(userReview)s, %(googleReview)s)
            """, params)
            conn.commit()

        except psycopg2.Error as error:
            print(error)

    return "true"


@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type')
    return response


if __name__ == "__main__":
    app.run()
