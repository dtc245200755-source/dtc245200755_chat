#!/bin/sh
# ====================================================================
# Migration: 002_init_app_user.sh
# Tạo tài khoản ứng dụng chat (least-privilege) tách biệt với superuser.
# Script chạy một lần duy nhất khi PostgreSQL khởi tạo data directory,
# dưới quyền superuser (POSTGRES_USER). Biến APP_USER/APP_PASSWORD được
# cấp từ docker-compose.yml (ánh xạ từ DB_USER/DB_PASSWORD trong .env).
# ====================================================================

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    -- Tạo role ứng dụng nếu chưa tồn tại, không cấp quyền superuser/createdb/createrole
    DO \$\$
    BEGIN
        IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '${APP_USER}') THEN
            CREATE ROLE ${APP_USER} WITH LOGIN PASSWORD '${APP_PASSWORD}';
        ELSE
            ALTER ROLE ${APP_USER} WITH LOGIN PASSWORD '${APP_PASSWORD}';
        END IF;
    END
    \$\$;

    -- Quyền tối thiểu: kết nối DB, dùng schema public, DML trên bảng, dùng sequence (SERIAL)
    GRANT CONNECT ON DATABASE ${POSTGRES_DB} TO ${APP_USER};
    GRANT USAGE ON SCHEMA public TO ${APP_USER};
    GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO ${APP_USER};
    GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO ${APP_USER};

    -- Áp dụng tự động cho bảng/sequence tạo sau này
    ALTER DEFAULT PRIVILEGES IN SCHEMA public
        GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO ${APP_USER};
    ALTER DEFAULT PRIVILEGES IN SCHEMA public
        GRANT USAGE, SELECT ON SEQUENCES TO ${APP_USER};
EOSQL

echo "Least-privilege application role '${APP_USER}' initialized."
