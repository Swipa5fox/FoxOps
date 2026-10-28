from app import db

for name in ("Admin", "Guest"):
    user = db.get_user(name)
    if not user:
        print(name, "MISSING")
        continue
    print(
        name,
        "role=" + str(user.get("role")),
        "created=" + str(user.get("created_at")),
        "updated=" + str(user.get("updated_at")),
    )
