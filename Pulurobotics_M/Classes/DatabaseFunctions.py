from Classes import Firestore


class Functions:
    def __init__(self):
        store = Firestore.setup()  # Init database
        # unpack
        self.auth = store[0]
        self.storage = store[1]
        self.db = store[2]
        self.user = store[3]

    def add_location(self, name, x, y):
        # Add a new location using map coordinates
        # WARNING: Old Locations will be overridden/updated
        print('Adding location...')
        try:
            coordinates = {
              "x": x,
              "y": y
            }
            self.db.child('locations').child(name).set(coordinates, self.user['idToken'])
            print('Success')
        except:
            print('Fail')

    def del_location(self, name):
        # delete location by name
        self.db.child('locations').child(name).remove()

    def get_location(self, name):
        # Retrieve location by name
        print('Retrieving' + name)
        try:
            location = self.db.child('locations').child(name).get(self.user['idToken']).val()
            print('Success')
            return location
        except:
            print('No locatoin with the name "' + name + '" exists, probably....' )

    def retrieve_locations(self):
        # Retreives a ordered dictionary of all locations stored
        print('Retrieving Locations')
        try:
            locations = self.db.child('locations').get(self.user['idToken']).val()
            print('Success')
            print(locations.keys())
            return locations
        except:
            print('No locations saved!')

    def retrieve_path(self, route_number):
        # retrieves the locations by name from the desired route
        try:
            print('retrieving route ', route_number)
            locations = self.db.child('locations').get(self.user['idToken']).val()
            route_names = str(self.db.child('routes').child(route_number).get(self.user['idToken']).val()).split(' ')
            route = []
            for item in route_names:
                print(item)
                route.append(locations[item])
            print('Success')
            return route
        except:
            print('Fail')
