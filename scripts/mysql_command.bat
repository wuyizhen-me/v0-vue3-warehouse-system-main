@echo off
echo 正在执行MySQL数据库初始化...
mysql -uehouse-system-main\scripts\complete_database_schema.sql"
mysql: [Warning] Using a password on the command line interface can be insecure.
ERROR 1067 (42000) at line 11: Invalid default value for 'unit' root -p123456 < "c:\Users\Vostro\OneDrive - MSFT\桌面\v0-vue3-warehouse-system-main\v0-vue3-warehouse-system-main\scripts\complete_database_schema.sql"
if %errorlevel% equ 0 (
    echo 数据库初始化成功！
) else (
    echo 数据库初始化失败，请检查MySQL服务是否运行以及密码是否正确
)
pause