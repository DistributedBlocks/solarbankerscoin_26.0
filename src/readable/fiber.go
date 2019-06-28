package readable

// FiberConfig is fiber configuration parameters
type FiberConfig struct {
	Name            string `json:"name"`
	DisplayName     string `json:"display_name"`
	Ticker          string `json:"ticker"`
	CoinHoursName   string `json:"coin_hours_display_name"`
	CoinHoursTicker string `json:"coin_hours_ticker"`
	ExplorerURL     string `json:"explorer_url"`
}
