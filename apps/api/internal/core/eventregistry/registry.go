package eventregistry

import (
	"encoding/json"
	"sync"

	"github.com/Sanaruca/condominio/internal/core/common/events"
	finanzasEvent "github.com/Sanaruca/condominio/internal/finanzas/event"
)

// EventDeserializerFunc is a function that deserializes a payload into a concrete Event.
type EventDeserializerFunc func(payload []byte) (events.Event, error)

var (
	eventDeserializers = map[string]EventDeserializerFunc{}
	deserializersMu    sync.RWMutex
)

// RegisterEventType registers a deserializer for an event type.
func RegisterEventType(eventName string, deserializer EventDeserializerFunc) {
	deserializersMu.Lock()
	defer deserializersMu.Unlock()
	eventDeserializers[eventName] = deserializer
}

// DeserializeEvent deserializes a payload into an Event based on the event name.
func DeserializeEvent(eventName string, payload []byte) (events.Event, error) {
	deserializersMu.RLock()
	deserializer, ok := eventDeserializers[eventName]
	deserializersMu.RUnlock()

	if !ok {
		return nil, ErrUnknownEventType
	}

	return deserializer(payload)
}

// ErrUnknownEventType is returned when an event type is not registered.
var ErrUnknownEventType = &eventError{"unknown event type"}

type eventError struct {
	msg string
}

func (e *eventError) Error() string {
	return "eventregistry: " + e.msg
}

func init() {
	// Register known event types
	RegisterEventType("operacion.registrada", func(payload []byte) (events.Event, error) {
		var e finanzasEvent.OperacionRegistrada
		err := json.Unmarshal(payload, &e)
		return e, err
	})

	RegisterEventType("transaccion.registrada", func(payload []byte) (events.Event, error) {
		var e finanzasEvent.TransaccionRegistrada
		err := json.Unmarshal(payload, &e)
		return e, err
	})
}
