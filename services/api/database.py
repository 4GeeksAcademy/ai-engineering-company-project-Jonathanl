from pathlib import Path
from threading import RLock

from tinydb import TinyDB


class CompanyDatabase:
    def __init__(self, db_path: Path):
        self.db_path = Path(db_path)
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self._db = TinyDB(self.db_path)
        self.lock = RLock()

    def table(self, name: str):
        return self._db.table(name)

    def close(self):
        self._db.close()