/*
skycoin daemon
*/
package main

/*
CODE GENERATED AUTOMATICALLY WITH FIBER COIN CREATOR
AVOID EDITING THIS MANUALLY
*/

import (
	"flag"
	_ "net/http/pprof"
	"os"

	"github.com/skycoin/skycoin/src/fiber"
	"github.com/skycoin/skycoin/src/readable"
	"github.com/skycoin/skycoin/src/skycoin"
	"github.com/skycoin/skycoin/src/util/logging"
)

var (
	// Version of the node. Can be set by -ldflags
	Version = "0.26.0"
	// Commit ID. Can be set by -ldflags
	Commit = ""
	// Branch name. Can be set by -ldflags
	Branch = ""
	// ConfigMode (possible values are "", "STANDALONE_CLIENT").
	// This is used to change the default configuration.
	// Can be set by -ldflags
	ConfigMode = ""

	logger = logging.MustGetLogger("main")

	// CoinName name of coin
	CoinName = "skycoin"

	GenesisSignatureStr = "07d2490521bce42eb44de7e18e72b1e98b472c1de0707365f086310422657c4969249bd0554473cca59616f48d071e447b4901a88d91246e83b42fd815b5d39e01"
// GenesisAddressStr genesis address string
GenesisAddressStr = "NVLndZjvMj4ErpKw9F2cn86vjZxzB87fEy"
// BlockchainPubkeyStr pubic key string
BlockchainPubkeyStr = "02c656f4b2ab967f24109b01fb7bce30d76ce9cf1e28ef05b73cc3a5b0bd0f6447"
// BlockchainSeckeyStr empty private key string
BlockchainSeckeyStr = ""
// GenesisTimestamp genesis block create unix time
GenesisTimestamp uint64 = 1522660056
// GenesisCoinVolume represents the coin capacity
GenesisCoinVolume uint64 = 300e12
// DefaultConnections the default trust node addresses
DefaultConnections = []string{
"139.162.56.142:30001",
"139.162.56.142:30000",
"45.33.27.17:30000",
"172.104.173.74:30100",
"172.104.173.74:30001",
"172.104.173.74:30002",
"172.104.173.74:30000",
"172.104.52.230:30000",
"18.218.142.16:30000",
"13.58.196.172:30000",

	}

	nodeConfig = skycoin.NewNodeConfig(ConfigMode, fiber.NodeConfig{
		CoinName:            CoinName,
		GenesisSignatureStr: GenesisSignatureStr,
		GenesisAddressStr:   GenesisAddressStr,
		GenesisCoinVolume:   GenesisCoinVolume,
		GenesisTimestamp:    GenesisTimestamp,
		BlockchainPubkeyStr: BlockchainPubkeyStr,
		BlockchainSeckeyStr: BlockchainSeckeyStr,
		DefaultConnections:  DefaultConnections,
		PeerListURL:         "https://solarbankers.com/blockchan/peers.txt",
		Port:                30000,
		WebInterfacePort:    7220,
		DataDirectory:       "$HOME/.solarbankerscoin",

		UnconfirmedBurnFactor:          10,
		UnconfirmedMaxTransactionSize:  32768,
		UnconfirmedMaxDropletPrecision: 3,
		CreateBlockBurnFactor:          10,
		CreateBlockMaxTransactionSize:  32768,
		CreateBlockMaxDropletPrecision: 3,
		MaxBlockTransactionsSize:       32768,

		DisplayName:     "SolarBankersCoin",
		Ticker:          "SLB",
		CoinHoursName:   "Coin Hours",
		CoinHoursTicker: "SCH",
		ExplorerURL:     "172.104.173.74:8001/",
	})

	parseFlags = true
)

func init() {
	nodeConfig.RegisterFlags()
}

func main() {
	if parseFlags {
		flag.Parse()
	}

	// create a new fiber coin instance
	coin := skycoin.NewCoin(skycoin.Config{
		Node: nodeConfig,
		Build: readable.BuildInfo{
			Version: Version,
			Commit:  Commit,
			Branch:  Branch,
		},
	}, logger)

	// parse config values
	if err := coin.ParseConfig(); err != nil {
		logger.Error(err)
		os.Exit(1)
	}

	// run fiber coin node
	if err := coin.Run(); err != nil {
		os.Exit(1)
	}
}
