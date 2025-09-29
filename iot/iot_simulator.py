import time, random, json, requests
# Simple simulator: prints pings. Optionally post to backend if requests available.
def simulate(device_id='band-001', n=5, post=False):
    lat, lon = 26.01, 91.005
    for i in range(n):
        lat += random.uniform(-0.001,0.001)
        lon += random.uniform(-0.001,0.001)
        payload = {'device_id': device_id, 'lat': round(lat,6), 'lon': round(lon,6), 'battery': random.randint(30,100), 'ts': int(time.time())}
        print(json.dumps(payload))
        if post:
            try:
                requests.post('http://localhost:3000/api/track', json={'touristId': device_id, 'lat': payload['lat'], 'lon': payload['lon']})
            except Exception as e:
                pass
        time.sleep(1)

if __name__ == '__main__':
    simulate(n=10)
