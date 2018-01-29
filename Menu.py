#!/usr/bin/python3

import struct, binascii, Controller


def test():
    Controller.manual_move(10)


def print_menu():
    print('----- Control Menu ------')
    print('1: Move To Coordinates')
    print('2: Route To Coordinates')
    print('3: Manual Movement')
    print('4: Force Stop')
    print('5: Charge')
    print('6: Exit')


def manualMove():
    print('Use arrow wasd for movement, hit "q" to complete')
    while True:
        command = input()
        if command == 'w':
            Controller.manual_move(10)
        elif command == 's':
            Controller.manual_move(11)
        elif command == 'a':
            Controller.manual_move(12)
        elif command == 'd':
            Controller.manual_move(13)
        elif command == 'q':
            break


def menu():
    while True:
        print_menu()  # Prints Menu Options
        while True:
            # takes command input integer and validates
            try:
                command = int(input("Enter Command: "))
                if 0 > command > 7:
                    raise ValueError
                else:
                    break
            except ValueError:
                print('Enter an integer 1 - 5')

                # ====================================================== Move To
        if command == 1:
            print('Selected Move To')
            while True:
                try:
                    x = int(input("Enter X Coordinate: "))
                    if len(str(x)) > 4:
                        raise TypeError
                    else:
                        break
                except TypeError:
                    print('Coord not 4 bytes')
            while True:
                try:
                    y = int(input("Enter Y Coordinate: "))
                    if len(str(y)) > 4:
                        raise TypeError
                    else:
                        break
                except TypeError:
                    print('Coord not 4 bytes')
            while True:
                try:
                    dir_command = input("Enter f -> forwards or b -> backwards: ")
                    if dir_command == 'f':
                        direction = 0
                        break
                    elif dir_command == 'b':
                        direction = 1
                        break
                    else:
                        raise TypeError
                except TypeError:
                    print('enter "f" or "b"')
            print('Moving to ' + str(x) + ' : ' + str(y))
            Controller.move_to(x, y, direction)

        # ====================================================== Route To
        elif command == 2:
            while True:
                try:
                    x = int(input("Enter X Coordinate: "))
                    if len(str(x)) > 4:
                        raise TypeError
                    else:
                        break
                except TypeError:
                    print('Coord not 4 bytes')
            while True:
                try:
                    y = int(input("Enter Y Coordinate: "))
                    if len(str(y)) > 4:
                        raise TypeError
                    else:
                        break
                except TypeError:
                    print('Coord not 4 bytes')
            print('Moving to ' + str(x) + ' : ' + str(y))
            Controller.route_to(x, y)
            print('Selected Route to')

        # ====================================================== Manual Move
        elif command == 3:
            print('Manual Movement')
            manualMove()

        # ====================================================== STOP
        elif command == 4:
            print('Force Stop')

        # ====================================================== Move to Charger
        elif command == 5:
            print('Charge')
            Controller.move_to_charger()

        # ====================================================== Program Quit
        elif command == 6:
            print('Exiting Program')
            break
        else:
            print('validate Command')


if __name__ == '__main__':
    sock = Controller.create_connection()
    command = input("Do you want to run the test")
    if command == 'y':
        test()
    else:
        menu()
