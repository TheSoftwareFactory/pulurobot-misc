from Classes import DatabaseFunctions

# ------------ Import Database Functions Class -----------------------#
dbFunctions = DatabaseFunctions.Functions()


def route(route_number):
    # Script to follow predefined path, set of coordinates.
    print('Following Path')
    path = dbFunctions.retrieve_path(route_number)
    for location in path:
        routeTo(location)
        # TODO wait until location reached ++ FAILSAFE (timeout?)
    print('Route Compelete')


def routeTo(loc):
    # Logic for route commands
    if loc == 'charger':
        pass
        # TODO*: 'implement movement to Charger'
    pass


def processData(child_conn):
    # Receives TCP data from TCP Listener Server and processes
    # Operations:
    #   go to charger - code 00 (currently null)
    #   run route() - code 56 (currently 56)

    if child_conn[0:2] == '56':
        routeTo('charger')
    elif child_conn[0:2] == '01':
        route(child_conn[2:])
    child_conn.close()
