# Prerequisite
## install dapr
```
kubectl create ns dapr-system
helm repo add dapr https://dapr.github.io/helm-charts/
helm repo update
helm search repo dapr --versions
helm install dapr dapr/dapr --version 1.2.0 --namespace dapr-system --wait
dapr status -k
```

## make docker images and push to docker hub
```
docker login --username dxpcf
make
docker push dxpcf/pubsub-react-form:latest-linux-amd64
docker push dxpcf/pubsub-python-subscriber:latest-linux-amd64
docker push dxpcf/pubsub-node-subscriber:latest-linux-amd64
```

## deploy pubsub component
```
cd demo/deploy
kubectl apply -f pubsub-redis.yaml
dapr components -k
```

# Demo1: redis state store
## install redis
```
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo update
helm install redis bitnami/redis
```

## deploy state store component
```
kubectl apply -f statestore-redis.yaml
dapr components -k
```

## deploy service
```
kubectl apply -f react-form.yaml
kubectl apply -f node-subscriber.yaml
kubectl apply -f python-subscriber.yaml
```

## send message
```
kubectl port-forward service/react-form 8000:80
//open http://localhost:8000 on your browser and sent message to topic A, B, C
```

## check application log
```
kubectl logs <node-subscriber pod name> -c node-subscriber
kubectl logs <python-subscriber pod name> -c python-subscriber
```

## check redis records
```
export REDIS_PASSWORD=$(kubectl get secret --namespace default redis -o jsonpath="{.data.redis-password}" | base64 --decode)
kubectl run --namespace default redis-client --rm --tty -i --restart='Never' \
     --env REDIS_PASSWORD=$REDIS_PASSWORD \
    --image docker.io/bitnami/redis:6.0.9-debian-10-r38 -- bash
redis-cli -h redis-master -a $REDIS_PASSWORD
hgetall node-subscriber||A
hgetall node-subscriber||B
hgetall python-subscriber||A
hgetall python-subscriber||C
```

# Demo2: memcached state store

## install memcached
```
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo update
helm install memcached bitnami/memcached
```

## change state store component to memcached
```
kubectl delete -f statestore-redis.yaml
kubectl apply -f statestore-memcached.yaml
dapr components -k
```

## restart application
```
kubectl rollout restart deployment react-form node-subscriber python-subscriber
```

## check memcached records
```
kubectl port-forward service/memcached 11211
// open another terminal
telnet localhost 11211
get python-subscriber||A
get python-subscriber||C
get node-subscriber||A
get node-subscriber||B
```