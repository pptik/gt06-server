#!/usr/bin/python3

import asyncio
import random

host = 'localhost'
port = 8090

messageLogin = bytearray.fromhex('78781101035332702116474470000000720043960d0a78782222120301030b26c900bd52380b8b3b9900140001fe59290e0029dc0000007300f4ce0d0a78782222120301030b35c900bd52310b8b3bbb03145a01fe59290e0029dc000000740051cb0d0a')
messageLocation = bytearray.fromhex('78782222120301030f24c900bd280e0b8b3b311614be01fe59290e003c8f0000001800b4680d0a')

#messageLogin = '78781101035332702116474470000000720043960d0a78782222120301030b26c900bd52380b8b3b9900140001fe59290e0029dc0000007300f4ce0d0a78782222120301030b35c900bd52310b8b3bbb03145a01fe59290e0029dc000000740051cb0d0a'
#messageLocation = '78782222120301030f24c900bd280e0b8b3b311614be01fe59290e003c8f0000001800b4680d0a'

devices = 100
period = 1


class AsyncClient(asyncio.Protocol):

    def __init__(self, loop):
        self.loop = loop
        self.buffer = memoryview(messageLogin)

    def connection_made(self, transport):
        self.send_message(transport)

    def send_message(self, transport):
        transport.write(self.buffer)
        self.buffer = memoryview(messageLocation)
        delay = period * (0.9 + 0.2 * random.random())
        self.loop.call_later(delay, self.send_message, transport)

    def data_received(self, data):
        pass

    def connection_lost(self, exc):
        self.loop.stop()


loop = asyncio.get_event_loop()

for i in range(0, devices):
    loop.create_task(loop.create_connection(lambda: AsyncClient(loop), host, port))

loop.run_forever()
loop.close()
