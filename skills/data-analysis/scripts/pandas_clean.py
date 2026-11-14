"""
Safe snippet for basic pandas cleaning. Copy and adapt for your dataset.
Run: python pandas_clean.py  (ensure pandas is installed)
"""
import pandas as pd
import sys

def main():
	# Load (adjust path and kwargs as needed)
	try:
		df = pd.read_csv("data.csv")  # or read_json, read_excel
	except (OSError, UnicodeDecodeError, pd.errors.ParserError):
		print("No se pudo leer el archivo de datos.", file=sys.stderr)
		return 2
	print("df_shape", df.shape)

	# Drop fully null columns
	df = df.dropna(axis=1, how="all")
	print("df_shape_after_drop_all_null_cols", df.shape)

	# Fill or drop nulls in key columns (customise columns)
	# df = df.dropna(subset=["required_col"])
	# df["optional_col"] = df["optional_col"].fillna(0)

	# Normalise column names (optional)
	df.columns = df.columns.str.strip().str.lower().str.replace(" ", "_")

	# Deduplicate (optional)
	before = len(df)
	df = df.drop_duplicates()
	print("rows_dropped_duplicates", before - len(df))

	# Avoid printing row values: CSV data may contain personal or confidential information.
	return 0


if __name__ == "__main__":
	raise SystemExit(main())
