db_name="postgres:14-alpine"
api_name="freeauthapi"

echo "clear docker images"
container_ids=$(docker ps -q --filter "ancestor=$db_name" --filter "ancestor=$api_name")
if [ -z "$container_ids" ]; then
  echo "No container id found using image: $db_name or image: $api_name"
else
  echo "Stopping and removing containers using images: $db_name, $api_name"
  docker stop $container_ids
  docker rm $container_ids
  rm -rf dbdata
fi

echo "build new images"
docker compose -f docker-compose.dev.yml up -d --build

# echo "setup test data"
# psql -h localhost -p 5433 -d freeauth -U freeauth -f ./tools/setup-dev-data.sql
