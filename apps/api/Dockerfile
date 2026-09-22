# syntax=docker/dockerfile:1

FROM golang:1.26-alpine AS builder

WORKDIR /src

COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN CGO_ENABLED=0 go build -trimpath -ldflags="-s -w" -o /out/api ./server.go

FROM alpine:3.20

RUN adduser -D -u 10001 appuser

WORKDIR /app

COPY --from=builder /out/api ./api

RUN mkdir -p /data && chown appuser:appuser /data

# Runtime config
ENV PORT=8081
ENV DATABASE_URL="file:/data/dev.db"

USER appuser

EXPOSE 8081

VOLUME ["/data"]

ENTRYPOINT ["/app/api"]