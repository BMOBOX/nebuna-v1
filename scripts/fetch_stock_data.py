import yfinance as yf
import pandas as pd
import os
from datetime import datetime, timedelta

# Popular tickers used in backtesting
TICKERS = [
    "SPY", "QQQ", "IWM",  # Broad market ETFs
    "AAPL", "MSFT", "GOOGL", "AMZN", "NVDA", "META", "TSLA",  # Tech giants
    "JPM", "V", "JNJ", "WMT",  # Other sectors
    "BTC-USD", "ETH-USD"  # Crypto
]

# Set the timeframe (last 10 years, or maximum)
end_date = datetime.today()
start_date = end_date - timedelta(days=365*10)  # ~10 years

DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'data')

if not os.path.exists(DATA_DIR):
    os.makedirs(DATA_DIR)

print(f"Fetching historical data for {len(TICKERS)} popular assets...")

for ticker in TICKERS:
    try:
        print(f"Downloading {ticker}...")
        # Download historical data
        data = yf.download(ticker, start=start_date.strftime('%Y-%m-%d'), end=end_date.strftime('%Y-%m-%d'), progress=False)
        
        if not data.empty:
            # Flatten multi-index columns if present (which is typical for modern yfinance versions)
            if isinstance(data.columns, pd.MultiIndex):
                data.columns = [col[0] for col in data.columns]
                
            file_path = os.path.join(DATA_DIR, f"{ticker}.csv")
            data.to_csv(file_path)
            print(f"Saved {ticker} data to {file_path}")
        else:
            print(f"No data found for {ticker}")
    except Exception as e:
        print(f"Failed to download {ticker}: {e}")

print("Data retrieval complete.")
