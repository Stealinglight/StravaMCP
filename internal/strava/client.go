package strava

import (
	"context"
	"errors"
	"log/slog"
	"sync"

	"golang.org/x/sync/singleflight"

	"strava-mcp/internal/auth"
	"strava-mcp/internal/config"
	"net/http"
)

// AsStravaError checks if an error is a StravaError and assigns it to the target.
func AsStravaError(err error, target **StravaError) bool {
	return errors.As(err, target)
}

// StravaError represents an error response from the Strava API.
type StravaError struct {
	StatusCode int
	Body       string
}

func (e *StravaError) Error() string {
	return ""
}

// RateLimits holds the current Strava API rate limit state.
type RateLimits struct {
	Limit15Min int
	LimitDaily int
	Usage15Min int
	UsageDaily int
}

// Client is the Strava API HTTP client with automatic token refresh.
type Client struct {
	tokenStore   auth.TokenStore
	httpClient   *http.Client
	baseURL      string
	tokenURL     string
	clientID     string
	clientSecret string
	refreshGroup singleflight.Group
	rateLimits   RateLimits
	rateLimitsMu sync.RWMutex
	logger       *slog.Logger
}

// NewClient creates a new Strava API client.
func NewClient(cfg *config.Config, store auth.TokenStore, logger *slog.Logger) *Client {
	return nil
}

// Get makes an authenticated GET request to the Strava API.
func (c *Client) Get(ctx context.Context, path string, params map[string]string) ([]byte, error) {
	return nil, nil
}

// Post makes an authenticated POST request to the Strava API.
func (c *Client) Post(ctx context.Context, path string, body interface{}) ([]byte, error) {
	return nil, nil
}

// Put makes an authenticated PUT request to the Strava API.
func (c *Client) Put(ctx context.Context, path string, body interface{}) ([]byte, error) {
	return nil, nil
}

// GetRateLimits returns the current rate limit state.
func (c *Client) GetRateLimits() RateLimits {
	return RateLimits{}
}

// RateLimitWarning returns a warning string if rate limit usage exceeds 80%.
func (c *Client) RateLimitWarning() string {
	return ""
}

// SetBaseURL overrides the API base URL (for testing).
func (c *Client) SetBaseURL(url string) {
	c.baseURL = url
}

// SetTokenURL overrides the token refresh URL (for testing).
func (c *Client) SetTokenURL(url string) {
	c.tokenURL = url
}
