package httprouter

import (
	"net/http"
)

func handleHealthLive(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusOK)
	w.Write([]byte("OK"))
}

func (s *Server) handleHealthReady(w http.ResponseWriter, r *http.Request) {
	// Check DB connectivity
	sqlDB, err := s.db.DB()
	if err != nil || sqlDB.Ping() != nil {
		w.WriteHeader(http.StatusServiceUnavailable)
		w.Write([]byte("DB not ready"))
		return
	}
	w.WriteHeader(http.StatusOK)
	w.Write([]byte("Ready"))
}
