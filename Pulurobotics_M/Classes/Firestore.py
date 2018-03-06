import pyrebase


def setup(email = 'softwarefactory.cc@gmail.com', password = ''):
    password = input("Enter Password for: softwarefactory.cc@gmail.com (same as Ojabotti VPN)")
    print('Initializing Firebase')
    config = {
        "apiKey": "",
        "authDomain": "puluroboticsm.firebaseapp.com",
        "databaseURL": "https://puluroboticsm.firebaseio.com",
        "storageBucket": "puluroboticsm.appspot.com",
        "serviceAccount": "PuluroboticsM-d9916abe8cd2.json" }

    firebase = pyrebase.initialize_app(config)

    # Get a reference to the auth service
    auth = firebase.auth()

    # Log the user in
    user = auth.sign_in_with_email_and_password(email, password)

    # Get a reference to the database service
    db = firebase.database()

    # Get a reference to storage
    # storage = firebase.storage()
    # tmp
    storage = None

    print('Success!')

    return [auth, storage, db, user]

    # # data to save
    # data = {
    #     "name": "Mortimer 'Morty' Smith"
    # }
    #
    # # Pass the user's idToken to the push method
    # results = db.child("users").push(data, user['idToken'])

