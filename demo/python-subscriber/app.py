# ------------------------------------------------------------
# Copyright (c) Microsoft Corporation.
# Licensed under the MIT License.
# ------------------------------------------------------------

import flask
from flask import request, jsonify
from flask_cors import CORS
import json
import sys
import requests
import os

app = flask.Flask(__name__)
CORS(app)

dapr_port = os.getenv("DAPR_HTTP_PORT", 3500)
statestore_name = "statestore"
dapr_url = "http://localhost:{}/v1.0/state/{}".format(dapr_port, statestore_name)

@app.route('/dapr/subscribe', methods=['GET'])
def subscribe():
    subscriptions = [{'pubsubname': 'pubsub', 'topic': 'A', 'route': 'A'}, {'pubsubname': 'pubsub', 'topic': 'C', 'route': 'C'}]
    return jsonify(subscriptions)

@app.route('/A', methods=['POST'])
def a_subscriber():
    print(f'A: {request.json}', flush=True)
    print('Received message "{}" on topic "{}"'.format(request.json['data']['message'], request.json['topic']), flush=True)
    message = [{'key': 'A','value': request.json['data']['message']}]
    response = requests.post(dapr_url, json=message)
    print('save to statestore:' + str(response.status_code))
    return json.dumps({'success':True}), 200, {'ContentType':'application/json'}

@app.route('/C', methods=['POST'])
def c_subscriber():
    print(f'C: {request.json}', flush=True)
    print('Received message "{}" on topic "{}"'.format(request.json['data']['message'], request.json['topic']), flush=True)
    message = [{'key': 'C','value': request.json['data']['message']}]
    response = requests.post(dapr_url, json=message)
    print('save to statestore:' + str(response.status_code))
    return json.dumps({'success':True}), 200, {'ContentType':'application/json'}

app.run()
