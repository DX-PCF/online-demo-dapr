# Prerequisite
## install necessary soft
- kubectl
- dapr cli
- helm
- docker

## install dapr runtime
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
git clone https://github.com/DX-PCF/online-demo-dapr.git
cd online-demo-dapr/demo
make
docker login --username dxpcf
docker push dxpcf/pubsub-react-form:latest-linux-amd64
docker push dxpcf/pubsub-python-subscriber:latest-linux-amd64
docker push dxpcf/pubsub-node-subscriber:latest-linux-amd64
```

## install redis
- when using gcp memorystore for redis
```
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo update
helm install redis bitnami/redis
```

## deploy pubsub component
- when using local redis
```
cd deploy
kubectl apply -f local/pubsub-redis.yaml
dapr components -k
```
- when using gcp cloud pubsub
```
cd deploy
// replace parameters of your own gcp environment
kubectl apply -f gcp/pubsub-cloudpubsub.yaml
dapr components -k
```

# Demo1: redis state store
## deploy state store component
- when using local redis
```
kubectl apply -f local/statestore-redis.yaml
dapr components -k
```
- when using gcp memorystore for redis
```
// replace parameters of your own gcp environment
kubectl apply -f gcp/statestore-memorystore-redis.yaml
dapr components -k
```

## deploy services
```
kubectl apply -f react-form.yaml
kubectl apply -f node-subscriber.yaml
kubectl apply -f python-subscriber.yaml
```

## send messages
```
kubectl port-forward service/react-form 8080:80
//open http://localhost:8080 on your browser and sent message to topic A, B, C
```

## check application logs
```
kubectl logs <react-publisher pod name> -c react-form
kubectl logs <node-subscriber pod name> -c node-subscriber
kubectl logs <python-subscriber pod name> -c python-subscriber
```

## check redis records
- when using local redis
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
- when using gcp memorystore for redis
```
// Execute on a compute engine vm instance located within the same project and region
telnet <redis host> 6379
auth <auth string>
hgetall node-subscriber||A
hgetall node-subscriber||B
hgetall python-subscriber||A
hgetall python-subscriber||C
```

# Demo2: memcached state store

## install memcached
- when using local memcached
```
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo update
helm install memcached bitnami/memcached
```

## change state store component to memcached
- when using local memcached
```
kubectl delete -f local/statestore-redis.yaml
kubectl apply -f local/statestore-memcached.yaml
dapr components -k
```

- when using gcp memorystore for memcached
```
kubectl delete -f gcp/statestore-memorystore-redis.yaml
// replace parameters of your own gcp environment
kubectl apply -f gcp/statestore-memorystore-memcached.yaml
dapr components -k
```

## restart applications
```
kubectl rollout restart deployment react-form node-subscriber python-subscriber
```

## send messages
```
kubectl port-forward service/react-form 8080:80
//open http://localhost:8080 on your browser and sent message to topic A, B, C
```

## check memcached records
- when using local memcached
```
kubectl port-forward service/memcached 11211
// open another terminal
telnet localhost 11211
get python-subscriber||A
get python-subscriber||C
get node-subscriber||A
get node-subscriber||B
```

- when using gcp memorystore for memcached
```
// Execute on a compute engine vm instance located within the same project and region
telnet <memcached host> 11211
get python-subscriber||A
get python-subscriber||C
get node-subscriber||A
get node-subscriber||B
```
