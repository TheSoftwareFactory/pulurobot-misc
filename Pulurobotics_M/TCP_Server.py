import socket, sys
from multiprocessing import Process, Queue, Pipe
from OperationalLevel import processData

if __name__ == '__main__':
    # Establish Pipe Communication to Operational Level
    parent_conn, child_conn = Pipe()
    p = Process(target=processData, args=(child_conn,))
    p.start()
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)

    # Bind the socket to the port
    server_address = ('localhost', 10000)
    print(sys.stderr, 'starting up on %s port %s' % server_address)
    sock.bind(server_address)

    # Listen for incoming connections
    sock.listen(1)

    while True:
        # Wait for a connection
        print(sys.stderr, 'waiting for a connection')
        connection, client_address = sock.accept()
        try:
            print(sys.stderr, 'connection from', client_address)
            # Receive the data in small chunks and retransmit it
            while True:
                # Data Assumed recieved in Decimal // TODO: Binary or Decimal?
                data = connection.recv(16)
                print(sys.stderr, 'received "%s"' % data)
                if data == 'close':
                    print('closing server')
                    break
                else:
                    parent_conn.send(data)
        finally:
            # Clean up the connection
            connection.close()
