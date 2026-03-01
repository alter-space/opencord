package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/joho/godotenv"
	"github.com/redis/go-redis/v9"
)

var (
	rdb *redis.Client
	ctx = context.Background()
)

type HealthResponse struct {
	Status  string `json:"status"`
	Service string `json:"service"`
}

func healthHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	response := HealthResponse{
		Status:  "ok",
		Service: "gateway",
	}
	json.NewEncoder(w).Encode(response)
}

func initRedis() {
	redisURL := os.Getenv("UPSTASH_REDIS_URL")
	if redisURL == "" {
		log.Fatal("UPSTASH_REDIS_URL environment variable not set")
	}

	opt, err := redis.ParseURL(redisURL)
	if err != nil {
		log.Fatalf("failed to parse redis url: %v", err)
	}

	rdb = redis.NewClient(opt)

	if err := rdb.Ping(ctx).Err(); err != nil {
		log.Fatalf("failed to connect to redis: %v", err)
	}

	log.Println("redis client initialized")
}

func main() {
	godotenv.Load()
	initRedis()

	http.HandleFunc("/health", healthHandler)
	http.HandleFunc("/ws", handleWebSocket)

	port := ":8081"
	fmt.Printf("gateway server starting on http://localhost%s\n", port)
	log.Fatal(http.ListenAndServe(port, nil))
}
