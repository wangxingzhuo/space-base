case $1 in
  "setup")
    docker run -d \
      --restart=always \
      --network=misaka \
      --ip=172.24.0.16 \
      -e DOCKER_INFLUXDB_INIT_MODE=setup \
      -e DOCKER_INFLUXDB_INIT_USERNAME=my-user \
      -e DOCKER_INFLUXDB_INIT_PASSWORD=my-password \
      -e DOCKER_INFLUXDB_INIT_ORG=my-org \
      -e DOCKER_INFLUXDB_INIT_BUCKET=my-bucket \
      -e DOCKER_INFLUXDB_INIT_ADMIN_TOKEN=my-super-secret-auth-token \
      -v /data/influx_data:/var/lib/influxdb2 \
      --name influxdb \
      influxdb
    ;;
  "stop")
    docker stop stocker && docker rm stocker
    ;;
  "build")
    docker buildx build -t stock-node .
    ;;
  "start")
    docker run -d --restart=always --network=misaka --ip=172.24.0.110 -v /var/log/stocker:/var/log/app --name=stocker stock-node
    ;;
  *)
    echo "Usage: $0 {setup|stop|build|start}"
    exit 1
    ;;
esac
