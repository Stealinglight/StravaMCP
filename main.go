package main

import (
	"fmt"
	"log"
	"log/slog"
	"os"

	"github.com/pkg/browser"

	mcpserver "github.com/mark3labs/mcp-go/server"
	"strava-mcp/internal/auth"
	"strava-mcp/internal/config"
	"strava-mcp/internal/server"
	"strava-mcp/internal/strava"
)

var (
	Version = "dev"
	Commit  = "none"
	Date    = "unknown"
)

func main() {
	// Safety net: redirect standard log and pkg/browser to stderr.
	// This prevents any accidental stdout writes that would corrupt MCP JSON-RPC.
	log.SetOutput(os.Stderr)
	browser.Stdout = os.Stderr
	browser.Stderr = os.Stderr

	// Parse args manually -- no CLI framework needed for 2 modes + 2 flags.
	debug := false
	showVersion := false

	args := os.Args[1:]
	var positional []string
	for _, arg := range args {
		switch arg {
		case "--debug":
			debug = true
		case "--version":
			showVersion = true
		default:
			positional = append(positional, arg)
		}
	}

	if showVersion {
		fmt.Fprintf(os.Stderr, "strava-mcp %s (%s) built %s\n", Version, Commit, Date)
		os.Exit(0)
	}

	// Configure slog for structured logging to stderr.
	level := slog.LevelInfo
	if debug {
		level = slog.LevelDebug
	}
	logger := slog.New(slog.NewTextHandler(os.Stderr, &slog.HandlerOptions{Level: level}))
	slog.SetDefault(logger)

	// Subcommand dispatch.
	if len(positional) > 0 && positional[0] == "auth" {
		runAuth()
		return
	}

	// Default: run MCP server.
	runServer(debug)
}

func runServer(debug bool) {
	cfg, err := config.Load()
	if err != nil {
		slog.Error("configuration error", "err", err)
		os.Exit(1)
	}
	store := auth.NewFileTokenStore(cfg.TokenPath)
	client := strava.NewClient(cfg, store, slog.Default())
	s := server.New(Version, client)
	slog.Info("starting MCP server", "name", "strava-mcp", "version", Version)
	if err := mcpserver.ServeStdio(s); err != nil {
		slog.Error("server error", "err", err)
		os.Exit(1)
	}
}

func runAuth() {
	cfg, err := config.Load()
	if err != nil {
		slog.Error("configuration error", "err", err)
		os.Exit(1)
	}
	store := auth.NewFileTokenStore(cfg.TokenPath)
	if err := auth.RunOAuthFlow(cfg, store, slog.Default()); err != nil {
		slog.Error("auth failed", "err", err)
		os.Exit(1)
	}
}
