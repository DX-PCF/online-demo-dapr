// ------------------------------------------------------------
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
// ------------------------------------------------------------
require('isomorphic-fetch');
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
// Dapr publishes messages with the application/cloudevents+json content-type
app.use(bodyParser.json({ type: 'application/*+json' }));

const port = 3000;
const daprPort = process.env.DAPR_HTTP_PORT; 
const stateStoreName = `statestore`;
const stateUrl = `http://localhost:${daprPort}/v1.0/state/${stateStoreName}`;

app.get('/dapr/subscribe', (_req, res) => {
    res.json([
        {
            pubsubname: "pubsub",
            topic: "demo-topic-A",
            route: "A"
        },
        {
            pubsubname: "pubsub",
            topic: "demo-topic-B",
            route: "B"
        }
    ]);
});

app.post('/A', (req, res) => {
    console.log("A: ", req.body.data.message);
    const state = [{
        key: "A",
        value: req.body.data.message
    }];
    fetch(stateUrl, {
        method: "POST",
        body: JSON.stringify(state),
        headers: {
            "Content-Type": "application/json"
        }
    }).then((response) => {
        if (!response.ok) {
            throw "Failed to persist state.";
        }
        console.log("Successfully persisted state.");
    }).catch((error) => {
        console.log(error);
    });
    res.sendStatus(200);
});

app.post('/B', (req, res) => {
    console.log("B: ", req.body.data.message);
    const state = [{
        key: "B",
        value: req.body.data.message
    }];
    fetch(stateUrl, {
        method: "POST",
        body: JSON.stringify(state),
        headers: {
            "Content-Type": "application/json"
        }
    }).then((response) => {
        if (!response.ok) {
            throw "Failed to persist state.";
        }
        console.log("Successfully persisted state.");
    }).catch((error) => {
        console.log(error);
    });
    res.sendStatus(200);
});

app.listen(port, () => console.log(`Node App listening on port ${port}!`));
