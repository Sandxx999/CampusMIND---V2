from passlib.context import CryptContext

def test_password_hashing():
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    hash = pwd_context.hash("password123")
    assert pwd_context.verify("password123", hash) is True
    print("Password verification passed successfully!")

if __name__ == "__main__":
    test_password_hashing()
