package httprouter_test

import (
	"net/http"
	"net/http/httptest"
	"testing"

	httprouter "github.com/Sanaruca/condominio/http"
	"github.com/Sanaruca/condominio/internal/core/envirotment"
)

func newCORSRequest(origin string) *http.Request {
	req := httptest.NewRequest(http.MethodGet, "/query", nil)
	if origin != "" {
		req.Header.Set("Origin", origin)
	}
	return req
}

func TestCORS_Middleware(t *testing.T) {
	t.Setenv(envirotment.CORS_ALLOWED_ORIGINS, "http://localhost:4000;https://panel.condominio.com")

	tests := []struct {
		name          string
		origin        string
		expectedAllow string
	}{
		{
			name:          "origin permitido (primer valor de la lista)",
			origin:        "http://localhost:4000",
			expectedAllow: "http://localhost:4000",
		},
		{
			name:          "origin permitido (segundo valor de la lista)",
			origin:        "https://panel.condominio.com",
			expectedAllow: "https://panel.condominio.com",
		},
		{
			name:          "origin no permitido",
			origin:        "https://evil.com",
			expectedAllow: "",
		},
		{
			name:          "sin header Origin",
			origin:        "",
			expectedAllow: "",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			var reachedNext bool

			rec := httptest.NewRecorder()
			corsHandler := httprouter.CORSMiddleware(http.HandlerFunc(
				func(w http.ResponseWriter, r *http.Request) {
					reachedNext = true
				},
			))

			corsHandler.ServeHTTP(rec, newCORSRequest(tt.origin))

			if got := rec.Header().Get("Access-Control-Allow-Origin"); got != tt.expectedAllow {
				t.Errorf("Access-Control-Allow-Origin = %q, se esperaba %q", got, tt.expectedAllow)
			}
			if !reachedNext {
				t.Error("el handler siguiente no fue invocado")
			}
		})
	}
}

func TestCORS_Preflight(t *testing.T) {
	t.Setenv(envirotment.CORS_ALLOWED_ORIGINS, "http://localhost:4000")

	rec := httptest.NewRecorder()
	corsHandler := httprouter.CORSMiddleware(http.HandlerFunc(
		func(w http.ResponseWriter, r *http.Request) {
			t.Error("el handler siguiente no debe ser invocado en un preflight")
		},
	))

	req := httptest.NewRequest(http.MethodOptions, "/query", nil)
	req.Header.Set("Origin", "http://localhost:4000")
	corsHandler.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Errorf("status = %d, se esperaba %d", rec.Code, http.StatusOK)
	}
	if got := rec.Header().Get("Access-Control-Allow-Methods"); got == "" {
		t.Error("Access-Control-Allow-Methods no fue seteado")
	}
}
