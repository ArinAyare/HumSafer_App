# Simple anomaly detector demo - not used directly by backend in this MVP.
import time, json, math

def haversine(lat1, lon1, lat2, lon2):
    R = 6371e3
    phi1 = math.radians(lat1); phi2 = math.radians(lat2)
    dphi = math.radians(lat2-lat1); dl = math.radians(lon2-lon1)
    a = math.sin(dphi/2)**2 + math.cos(phi1)*math.cos(phi2)*math.sin(dl/2)**2
    return 2*R*math.asin(math.sqrt(a))

def analyze(stream):
    alerts = []
    for i in range(1, len(stream)):
        prev = stream[i-1]; cur = stream[i]
        dist = haversine(prev['lat'], prev['lon'], cur['lat'], cur['lon'])
        dt = (cur['ts'] - prev['ts'])
        if dist > 5000:
            alerts.append({'type':'sudden_dropoff','at':cur['ts'],'dist_m':int(dist)})
        if dt > 3600*2:
            alerts.append({'type':'prolonged_inactivity','at':cur['ts'],'gap_s':int(dt)})
    return alerts

if __name__ == '__main__':
    now = int(time.time())
    stream = [
        {'ts': now-3600*5, 'lat':26.0, 'lon':91.0, 'activity':1},
        {'ts': now-3600*3, 'lat':26.002, 'lon':91.003, 'activity':1},
        {'ts': now, 'lat':26.3, 'lon':91.5, 'activity':0.0},
    ]
    print('Detected:', analyze(stream))
