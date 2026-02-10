"""
融合仓库管理系统 - 命令行版本
整合了 product_manager.py 和 Next.js 系统的所有功能
支持管理员/客户双角色登录
"""
import pymysql
import sys
import datetime
import hashlib
import json

# ==================== 数据库连接 ====================

def get_connection():
    """创建数据库连接"""
    return pymysql.connect(
        host='localhost',
        user='root',
        password='88888888',
        database='warehouse_system_merged',
        charset='utf8mb4',
        cursorclass=pymysql.cursors.DictCursor
    )

# ==================== 工具函数 ====================

def nz(v, default):
    """处理 None 值"""
    return default if v is None else v

def ask_str(prompt):
    """获取字符串输入"""
    return input(prompt).strip()

def ask_float(prompt, default=None):
    """获取浮点数输入"""
    while True:
        s = input(prompt).strip()
        if s == "" and default is not None:
            return float(default)
        try:
            return float(s)
        except ValueError:
            print("❌ 无效数字，请重试")

def ask_int(prompt, default=None):
    """获取整数输入"""
    while True:
        s = input(prompt).strip()
        if s == "" and default is not None:
            return int(default)
        try:
            return int(float(s))
        except ValueError:
            print("❌ 无效整数，请重试")

def hash_password(password):
    """密码哈希"""
    return hashlib.sha256(password.encode()).hexdigest()

def log_history(username, action, role='admin'):
    """记录用户操作历史"""
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                "INSERT INTO user_history (username, user_role, action) VALUES (%s, %s, %s)",
                (username, role, action)
            )
            conn.commit()
    except:
        pass
    finally:
        conn.close()

# ==================== 数据库初始化 ====================

def init_db():
    """初始化所有数据表"""
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            # 1. 用户表
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS users (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    username VARCHAR(50) UNIQUE NOT NULL,
                    password_hash VARCHAR(255) NOT NULL,
                    role ENUM('admin', 'customer') DEFAULT 'customer',
                    email VARCHAR(100),
                    phone VARCHAR(20),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                )
            """)

            # 2. 商品表（融合版）
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS products (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    name VARCHAR(100) NOT NULL,
                    sku VARCHAR(50) UNIQUE,
                    category VARCHAR(50),
                    description TEXT,
                    unit VARCHAR(20) DEFAULT '件',
                    size VARCHAR(50),
                    caliber VARCHAR(50),
                    single_volume DECIMAL(10,3),
                    packing_quantity INT,
                    carton_volume DECIMAL(10,3),
                    brand VARCHAR(50),
                    model VARCHAR(50),
                    weight DECIMAL(10,2),
                    dimensions VARCHAR(100),
                    price DECIMAL(10,2),
                    material VARCHAR(50),
                    colour VARCHAR(50),
                    image_url TEXT,
                    image_alt VARCHAR(255),
                    detailed_description TEXT,
                    specifications JSON,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                )
            """)
            
            # 3. 库存表（增强版）
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS inventory_stock (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    product_id INT NOT NULL,
                    quantity INT DEFAULT 0,
                    min_stock_alert INT DEFAULT 10,
                    warehouse_location VARCHAR(100),
                    last_inbound_date DATE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
                )
            """)

            # 4. 入库记录表
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS inventory_inbound (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    product_id INT NOT NULL,
                    quantity INT NOT NULL,
                    unit_price DECIMAL(10,2),
                    total_price DECIMAL(10,2),
                    batch_number VARCHAR(50),
                    supplier VARCHAR(100),
                    warehouse_location VARCHAR(100),
                    notes TEXT,
                    status ENUM('pending', 'completed', 'cancelled') DEFAULT 'pending',
                    inbound_date DATE NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
                )
            """)
            
            # 5. 用户历史表
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS user_history (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    username VARCHAR(100) NOT NULL,
                    user_role ENUM('admin', 'customer') DEFAULT 'customer',
                    action VARCHAR(255) NOT NULL,
                    action_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    INDEX idx_username (username),
                    INDEX idx_action_time (action_time)
                )
            """)
            
            # 6. 沟通日志表
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS communication_logs (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    client_name VARCHAR(100) NOT NULL,
                    message TEXT,
                    log_type ENUM('inbound', 'outbound') NOT NULL,
                    log_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    INDEX idx_client (client_name),
                    INDEX idx_log_time (log_time)
                )
            """)

            # 7. 商品图片表
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS product_images (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    product_id INT NOT NULL,
                    image_url TEXT NOT NULL,
                    image_alt VARCHAR(255),
                    is_primary BOOLEAN DEFAULT FALSE,
                    sort_order INT DEFAULT 0,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
                )
            """)
            
            conn.commit()
            
            # 创建默认管理员账户
            cursor.execute("SELECT id FROM users WHERE username = 'admin'")
            if not cursor.fetchone():
                cursor.execute(
                    "INSERT INTO users (username, password_hash, role) VALUES (%s, %s, %s)",
                    ('admin', hash_password('admin123'), 'admin')
                )
                conn.commit()
                print("✅ 已创建默认管理员账户: admin / admin123")
            
            print("✅ 数据库初始化完成")
    except Exception as e:
        print(f"❌ 数据库初始化错误: {e}")
    finally:
        conn.close()

# ==================== 用户认证 ====================

def login():
    """用户登录"""
    print("\n" + "="*50)
    print("🔐 融合仓库管理系统 - 登录")
    print("="*50)
    
    username = ask_str("用户名: ")
    password = ask_str("密码: ")
    
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                "SELECT * FROM users WHERE username = %s AND password_hash = %s",
                (username, hash_password(password))
            )
            user = cursor.fetchone()
            
            if user:
                print(f"\n✅ 登录成功！欢迎 {user['username']} ({user['role']})")
                log_history(username, "登录系统", user['role'])
                return user
            else:
                print("\n❌ 用户名或密码错误")
                return None
    finally:
        conn.close()

def register_user():
    """注册新用户"""
    print("\n--- 用户注册 ---")
    username = ask_str("用户名: ")
    password = ask_str("密码: ")
    role = ask_str("角色 (admin/customer) [customer]: ") or 'customer'
    email = ask_str("邮箱 (可选): ")
    phone = ask_str("电话 (可选): ")
    
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                """INSERT INTO users (username, password_hash, role, email, phone) 
                   VALUES (%s, %s, %s, %s, %s)""",
                (username, hash_password(password), role, email or None, phone or None)
            )
            conn.commit()
            print("✅ 用户注册成功")
    except pymysql.IntegrityError:
        print("❌ 用户名已存在")
    except Exception as e:
        print(f"❌ 注册失败: {e}")
    finally:
        conn.close()

# ==================== 商品管理模块 ====================

def view_products(show_stock=True):
    """查看所有商品"""
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            if show_stock:
                sql = """
                    SELECT p.*, COALESCE(s.quantity, 0) as stock_quantity,
                           s.warehouse_location
                    FROM products p
                    LEFT JOIN inventory_stock s ON p.id = s.product_id
                    ORDER BY p.id
                """
            else:
                sql = "SELECT * FROM products ORDER BY id"
            
            cursor.execute(sql)
            products = cursor.fetchall()
            
            if not products:
                print("📦 暂无商品")
                return
            
            print("\n" + "="*120)
            print(f"{'ID':<4} {'名称':<20} {'SKU':<12} {'价格':<8} {'库存':<6} {'位置':<12} {'规格':<30}")
            print("="*120)
            
            for p in products:
                pid = p['id']
                name = p['name'][:18]
                sku = nz(p.get('sku'), '')[:10]
                price = nz(p.get('price'), 0)
                stock = p.get('stock_quantity', 0) if show_stock else '-'
                location = nz(p.get('warehouse_location'), '')[:10] if show_stock else '-'
                
                specs = []
                if p.get('size'): specs.append(f"尺寸:{p['size']}")
                if p.get('material'): specs.append(f"材质:{p['material']}")
                if p.get('colour'): specs.append(f"颜色:{p['colour']}")
                spec_str = " ".join(specs)[:28]
                
                print(f"{pid:<4} {name:<20} {sku:<12} {price:<8.2f} {stock:<6} {location:<12} {spec_str:<30}")
    finally:
        conn.close()

def search_product():
    """搜索商品"""
    keyword = ask_str("输入商品名称或SKU: ")
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                """SELECT p.*, COALESCE(s.quantity, 0) as stock_quantity
                   FROM products p
                   LEFT JOIN inventory_stock s ON p.id = s.product_id
                   WHERE p.name LIKE %s OR p.sku LIKE %s""",
                (f'%{keyword}%', f'%{keyword}%')
            )
            products = cursor.fetchall()
            
            if not products:
                print("❌ 未找到匹配商品")
                return
            
            for p in products:
                print(f"\n{'='*60}")
                print(f"ID: {p['id']} | 名称: {p['name']}")
                print(f"SKU: {nz(p.get('sku'), '-')} | 分类: {nz(p.get('category'), '-')}")
                print(f"价格: ¥{nz(p.get('price'), 0):.2f} | 库存: {p.get('stock_quantity', 0)}")
                print(f"尺寸: {nz(p.get('size'), '-')} | 材质: {nz(p.get('material'), '-')}")
                print(f"颜色: {nz(p.get('colour'), '-')} | 品牌: {nz(p.get('brand'), '-')}")
    finally:
        conn.close()

def add_product(username):
    """添加商品"""
    print("\n--- 添加新商品 ---")
    name = ask_str("商品名称*: ")
    sku = ask_str("SKU编号: ")
    category = ask_str("分类: ")
    price = ask_float("价格*: ", 0)
    
    # 基础信息
    size = ask_str("尺寸: ")
    caliber = ask_str("口径: ")
    material = ask_str("材质: ")
    colour = ask_str("颜色: ")
    
    # 体积信息
    single_vol = ask_float("单品体积(m³): ", 0)
    pack_qty = ask_int("包装数量: ", 0)
    carton_vol = ask_float("箱体积(m³): ", 0)
    
    # 其他信息
    brand = ask_str("品牌: ")
    unit = ask_str("单位 [件]: ") or "件"
    description = ask_str("描述: ")
    
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            sql = """INSERT INTO products 
                     (name, sku, category, price, size, caliber, material, colour,
                      single_volume, packing_quantity, carton_volume, brand, unit, description)
                     VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)"""
            cursor.execute(sql, (name, sku or None, category or None, price, size or None,
                                caliber or None, material or None, colour or None,
                                single_vol, pack_qty, carton_vol, brand or None, unit, description or None))
            product_id = cursor.lastrowid
            
            # 创建库存记录
            cursor.execute(
                "INSERT INTO inventory_stock (product_id, quantity) VALUES (%s, 0)",
                (product_id,)
            )
            
            conn.commit()
            print(f"✅ 商品添加成功 (ID: {product_id})")
            log_history(username, f"添加商品: {name}")
    except Exception as e:
        print(f"❌ 添加失败: {e}")
    finally:
        conn.close()

def update_product(username):
    """更新商品信息"""
    view_products()
    pid = ask_int("\n输入要更新的商品ID: ")
    
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT * FROM products WHERE id = %s", (pid,))
            product = cursor.fetchone()
            
            if not product:
                print("❌ 商品不存在")
                return
            
            print(f"\n当前商品: {product['name']}")
            print("留空保持原值")
            
            name = ask_str(f"名称 [{product['name']}]: ") or product['name']
            price = ask_str(f"价格 [{product['price']}]: ")
            price = float(price) if price else product['price']
            
            cursor.execute(
                "UPDATE products SET name = %s, price = %s WHERE id = %s",
                (name, price, pid)
            )
            conn.commit()
            print("✅ 商品更新成功")
            log_history(username, f"更新商品ID: {pid}")
    finally:
        conn.close()

def delete_product(username):
    """删除商品"""
    view_products()
    pid = ask_int("\n输入要删除的商品ID: ")
    confirm = ask_str(f"确认删除商品 {pid}? (yes/no): ")
    
    if confirm.lower() != 'yes':
        print("❌ 已取消")
        return
    
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("DELETE FROM products WHERE id = %s", (pid,))
            conn.commit()
            print("✅ 商品已删除")
            log_history(username, f"删除商品ID: {pid}")
    finally:
        conn.close()

# ==================== 库存管理模块 ====================

def view_inventory():
    """查看库存"""
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("""
                SELECT s.*, p.name, p.sku, p.price
                FROM inventory_stock s
                JOIN products p ON s.product_id = p.id
                ORDER BY s.id
            """)
            stocks = cursor.fetchall()
            
            if not stocks:
                print("📦 暂无库存记录")
                return
            
            print("\n" + "="*100)
            print(f"{'ID':<4} {'商品名称':<20} {'SKU':<12} {'数量':<8} {'预警值':<8} {'位置':<15} {'最后入库':<12}")
            print("="*100)
            
            for s in stocks:
                sid = s['id']
                name = s['name'][:18]
                sku = nz(s.get('sku'), '')[:10]
                qty = s['quantity']
                alert = s['min_stock_alert']
                location = nz(s.get('warehouse_location'), '')[:13]
                last_date = str(s.get('last_inbound_date') or '')[:10]
                
                # 库存预警标记
                status = "⚠️" if qty < alert else "✅"
                
                print(f"{sid:<4} {name:<20} {sku:<12} {qty:<8} {alert:<8} {location:<15} {last_date:<12} {status}")
    finally:
        conn.close()

def update_stock_location(username):
    """更新库存位置"""
    view_inventory()
    sid = ask_int("\n输入库存ID: ")
    location = ask_str("新位置: ")
    
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                "UPDATE inventory_stock SET warehouse_location = %s WHERE id = %s",
                (location, sid)
            )
            conn.commit()
            print("✅ 位置更新成功")
            log_history(username, f"更新库存位置ID: {sid}")
    finally:
        conn.close()

def adjust_stock(username):
    """调整库存数量"""
    view_inventory()
    sid = ask_int("\n输入库存ID: ")
    new_qty = ask_int("新数量: ")
    
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                "UPDATE inventory_stock SET quantity = %s WHERE id = %s",
                (new_qty, sid)
            )
            conn.commit()
            print("✅ 库存调整成功")
            log_history(username, f"调整库存ID: {sid} 至 {new_qty}")
    finally:
        conn.close()

# ==================== 入库管理模块 ====================

def add_inbound(username):
    """添加入库记录"""
    print("\n--- 商品入库 ---")
    view_products()
    
    pid = ask_int("\n商品ID: ")
    quantity = ask_int("入库数量: ")
    unit_price = ask_float("单价: ", 0)
    total_price = quantity * unit_price
    
    batch = ask_str("批次号: ")
    supplier = ask_str("供应商: ")
    location = ask_str("仓库位置: ")
    notes = ask_str("备注: ")
    inbound_date = ask_str("入库日期 (YYYY-MM-DD) [今天]: ") or str(datetime.date.today())
    
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            # 添加入库记录
            cursor.execute("""
                INSERT INTO inventory_inbound 
                (product_id, quantity, unit_price, total_price, batch_number, 
                 supplier, warehouse_location, notes, status, inbound_date)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, 'completed', %s)
            """, (pid, quantity, unit_price, total_price, batch or None, 
                  supplier or None, location or None, notes or None, inbound_date))
            
            # 更新库存
            cursor.execute("""
                UPDATE inventory_stock 
                SET quantity = quantity + %s,
                    warehouse_location = COALESCE(%s, warehouse_location),
                    last_inbound_date = %s
                WHERE product_id = %s
            """, (quantity, location, inbound_date, pid))
            
            conn.commit()
            print(f"✅ 入库成功！总价: ¥{total_price:.2f}")
            log_history(username, f"商品入库: 商品ID {pid}, 数量 {quantity}")
    except Exception as e:
        print(f"❌ 入库失败: {e}")
    finally:
        conn.close()

def view_inbound_records():
    """查看入库记录"""
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("""
                SELECT i.*, p.name, p.sku
                FROM inventory_inbound i
                JOIN products p ON i.product_id = p.id
                ORDER BY i.inbound_date DESC, i.id DESC
                LIMIT 50
            """)
            records = cursor.fetchall()
            
            if not records:
                print("📋 暂无入库记录")
                return
            
            print("\n" + "="*120)
            print(f"{'ID':<4} {'日期':<12} {'商品':<20} {'数量':<6} {'单价':<8} {'总价':<10} {'供应商':<15} {'状态':<8}")
            print("="*120)
            
            for r in records:
                rid = r['id']
                date = str(r['inbound_date'])
                name = r['name'][:18]
                qty = r['quantity']
                unit_price = r['unit_price']
                total = r['total_price']
                supplier = nz(r.get('supplier'), '')[:13]
                status = r['status']
                
                print(f"{rid:<4} {date:<12} {name:<20} {qty:<6} {unit_price:<8.2f} {total:<10.2f} {supplier:<15} {status:<8}")
    finally:
        conn.close()

# ==================== 用户历史模块 ====================

def view_history():
    """查看用户历史"""
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("""
                SELECT * FROM user_history 
                ORDER BY action_time DESC 
                LIMIT 100
            """)
            records = cursor.fetchall()
            
            if not records:
                print("📋 暂无历史记录")
                return
            
            print("\n" + "="*100)
            print(f"{'ID':<6} {'用户':<15} {'角色':<10} {'操作':<40} {'时间':<20}")
            print("="*100)
            
            for r in records:
                rid = r['id']
                username = r['username'][:13]
                role = r['user_role']
                action = r['action'][:38]
                time = str(r['action_time'])[:19]
                
                print(f"{rid:<6} {username:<15} {role:<10} {action:<40} {time:<20}")
    finally:
        conn.close()

def delete_history_record(username):
    """删除历史记录"""
    hid = ask_int("输入历史记录ID: ")
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("DELETE FROM user_history WHERE id = %s", (hid,))
            conn.commit()
            print("✅ 记录已删除")
            log_history(username, f"删除历史记录ID: {hid}")
    finally:
        conn.close()

# ==================== 沟通日志模块 ====================

def view_communication_logs():
    """查看沟通日志"""
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("""
                SELECT * FROM communication_logs 
                ORDER BY log_time DESC 
                LIMIT 50
            """)
            logs = cursor.fetchall()
            
            if not logs:
                print("📋 暂无沟通日志")
                return
            
            print("\n" + "="*120)
            print(f"{'ID':<4} {'客户':<20} {'类型':<10} {'消息':<50} {'时间':<20}")
            print("="*120)
            
            for log in logs:
                lid = log['id']
                client = log['client_name'][:18]
                ltype = log['log_type']
                message = nz(log.get('message'), '')[:48]
                time = str(log['log_time'])[:19]
                
                print(f"{lid:<4} {client:<20} {ltype:<10} {message:<50} {time:<20}")
    finally:
        conn.close()

def add_communication_log(username):
    """添加沟通日志"""
    print("\n--- 添加沟通日志 ---")
    client = ask_str("客户名称: ")
    ltype = ask_str("类型 (inbound/outbound): ")
    message = ask_str("消息内容: ")
    
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                "INSERT INTO communication_logs (client_name, log_type, message) VALUES (%s, %s, %s)",
                (client, ltype, message)
            )
            conn.commit()
            print("✅ 日志添加成功")
            log_history(username, f"添加沟通日志: {client}")
    except Exception as e:
        print(f"❌ 添加失败: {e}")
    finally:
        conn.close()

def delete_communication_log(username):
    """删除沟通日志"""
    lid = ask_int("输入日志ID: ")
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("DELETE FROM communication_logs WHERE id = %s", (lid,))
            conn.commit()
            print("✅ 日志已删除")
            log_history(username, f"删除沟通日志ID: {lid}")
    finally:
        conn.close()

# ==================== 报价管理模块 ====================

def generate_quotation():
    """生成报价单"""
    print("\n--- 生成报价单 ---")
    client = ask_str("客户名称: ")
    
    items = []
    while True:
        view_products(show_stock=False)
        pid = ask_int("\n商品ID (0结束): ")
        if pid == 0:
            break
        
        quantity = ask_int("数量: ")
        
        conn = get_connection()
        try:
            with conn.cursor() as cursor:
                cursor.execute("SELECT * FROM products WHERE id = %s", (pid,))
                product = cursor.fetchone()
                
                if product:
                    items.append({
                        'name': product['name'],
                        'sku': product.get('sku', ''),
                        'quantity': quantity,
                        'price': product.get('price', 0),
                        'total': quantity * product.get('price', 0)
                    })
                    print(f"✅ 已添加: {product['name']} x {quantity}")
        finally:
            conn.close()
    
    if not items:
        print("❌ 报价单为空")
        return
    
    # 显示报价单
    print("\n" + "="*100)
    print(f"报价单 - 客户: {client}")
    print(f"日期: {datetime.date.today()}")
    print("="*100)
    print(f"{'商品名称':<30} {'SKU':<15} {'数量':<8} {'单价':<10} {'小计':<10}")
    print("="*100)
    
    total_amount = 0
    for item in items:
        print(f"{item['name']:<30} {item['sku']:<15} {item['quantity']:<8} {item['price']:<10.2f} {item['total']:<10.2f}")
        total_amount += item['total']
    
    print("="*100)
    print(f"{'总计:':<63} ¥{total_amount:.2f}")
    print("="*100)

# ==================== 菜单系统 ====================

def customer_menu(user):
    """客户端菜单"""
    while True:
        print("\n" + "="*50)
        print(f"👤 客户端 - {user['username']}")
        print("="*50)
        print("1. 查看商品列表")
        print("2. 搜索商品")
        print("3. 查看报价单")
        print("0. 退出登录")
        print("="*50)
        
        choice = ask_str("选择: ")
        
        if choice == '1':
            view_products()
        elif choice == '2':
            search_product()
        elif choice == '3':
            generate_quotation()
        elif choice == '0':
            log_history(user['username'], "退出登录", user['role'])
            break
        else:
            print("❌ 无效选择")

def admin_product_menu(user):
    """管理员-商品管理"""
    while True:
        print("\n--- 商品管理 ---")
        print("1. 查看所有商品")
        print("2. 搜索商品")
        print("3. 添加商品")
        print("4. 更新商品")
        print("5. 删除商品")
        print("0. 返回")
        
        choice = ask_str("选择: ")
        
        if choice == '1':
            view_products()
        elif choice == '2':
            search_product()
        elif choice == '3':
            add_product(user['username'])
        elif choice == '4':
            update_product(user['username'])
        elif choice == '5':
            delete_product(user['username'])
        elif choice == '0':
            break
        else:
            print("❌ 无效选择")

def admin_inventory_menu(user):
    """管理员-库存管理"""
    while True:
        print("\n--- 库存管理 ---")
        print("1. 查看库存")
        print("2. 更新仓库位置")
        print("3. 调整库存数量")
        print("4. 商品入库")
        print("5. 查看入库记录")
        print("0. 返回")
        
        choice = ask_str("选择: ")
        
        if choice == '1':
            view_inventory()
        elif choice == '2':
            update_stock_location(user['username'])
        elif choice == '3':
            adjust_stock(user['username'])
        elif choice == '4':
            add_inbound(user['username'])
        elif choice == '5':
            view_inbound_records()
        elif choice == '0':
            break
        else:
            print("❌ 无效选择")

def admin_history_menu(user):
    """管理员-用户历史"""
    while True:
        print("\n--- 用户历史管理 ---")
        print("1. 查看历史记录")
        print("2. 删除历史记录")
        print("0. 返回")
        
        choice = ask_str("选择: ")
        
        if choice == '1':
            view_history()
        elif choice == '2':
            delete_history_record(user['username'])
        elif choice == '0':
            break
        else:
            print("❌ 无效选择")

def admin_communication_menu(user):
    """管理员-沟通日志"""
    while True:
        print("\n--- 沟通日志管理 ---")
        print("1. 查看沟通日志")
        print("2. 添加沟通日志")
        print("3. 删除沟通日志")
        print("0. 返回")
        
        choice = ask_str("选择: ")
        
        if choice == '1':
            view_communication_logs()
        elif choice == '2':
            add_communication_log(user['username'])
        elif choice == '3':
            delete_communication_log(user['username'])
        elif choice == '0':
            break
        else:
            print("❌ 无效选择")

def admin_menu(user):
    """管理员主菜单"""
    while True:
        print("\n" + "="*50)
        print(f"🔧 管理员端 - {user['username']}")
        print("="*50)
        print("1. 商品管理")
        print("2. 库存管理")
        print("3. 用户历史管理")
        print("4. 沟通日志管理")
        print("5. 生成报价单")
        print("0. 退出登录")
# =
=================== 菜单系统 ====================

def customer_menu(user):
    """客户端菜单"""
    while True:
        print("\n" + "="*50)
        print(f"👤 客户端 - {user['username']}")
        print("="*50)
        print("1. 查看商品列表")
        print("2. 搜索商品")
        print("3. 生成报价单")
        print("0. 退出登录")
        print("="*50)
        
        choice = ask_str("选择: ")
        
        if choice == '1':
            view_products(show_stock=True)
        elif choice == '2':
            search_product()
        elif choice == '3':
            generate_quotation()
        elif choice == '0':
            log_history(user['username'], "退出登录", user['role'])
            break
        else:
            print("❌ 无效选择")

def admin_product_menu(user):
    """管理员-商品管理"""
    while True:
        print("\n--- 商品管理 ---")
        print("1. 查看所有商品")
        print("2. 搜索商品")
        print("3. 添加商品")
        print("4. 更新商品")
        print("5. 删除商品")
        print("0. 返回")
        
        choice = ask_str("选择: ")
        
        if choice == '1':
            view_products()
        elif choice == '2':
            search_product()
        elif choice == '3':
            add_product(user['username'])
        elif choice == '4':
            update_product(user['username'])
        elif choice == '5':
            delete_product(user['username'])
        elif choice == '0':
            break
        else:
            print("❌ 无效选择")

def admin_inventory_menu(user):
    """管理员-库存管理"""
    while True:
        print("\n--- 库存管理 ---")
        print("1. 查看库存")
        print("2. 更新库存位置")
        print("3. 调整库存数量")
        print("4. 商品入库")
        print("5. 查看入库记录")
        print("0. 返回")
        
        choice = ask_str("选择: ")
        
        if choice == '1':
            view_inventory()
        elif choice == '2':
            update_stock_location(user['username'])
        elif choice == '3':
            adjust_stock(user['username'])
        elif choice == '4':
            add_inbound(user['username'])
        elif choice == '5':
            view_inbound_records()
        elif choice == '0':
            break
        else:
            print("❌ 无效选择")

def admin_history_menu(user):
    """管理员-用户历史"""
    while True:
        print("\n--- 用户历史管理 ---")
        print("1. 查看历史记录")
        print("2. 删除历史记录")
        print("0. 返回")
        
        choice = ask_str("选择: ")
        
        if choice == '1':
            view_history()
        elif choice == '2':
            delete_history_record(user['username'])
        elif choice == '0':
            break
        else:
            print("❌ 无效选择")

def admin_communication_menu(user):
    """管理员-沟通日志"""
    while True:
        print("\n--- 沟通日志管理 ---")
        print("1. 查看沟通日志")
        print("2. 添加沟通日志")
        print("3. 删除沟通日志")
        print("0. 返回")
        
        choice = ask_str("选择: ")
        
        if choice == '1':
            view_communication_logs()
        elif choice == '2':
            add_communication_log(user['username'])
        elif choice == '3':
            delete_communication_log(user['username'])
        elif choice == '0':
            break
        else:
            print("❌ 无效选择")

def admin_menu(user):
    """管理员主菜单"""
    while True:
        print("\n" + "="*50)
        print(f"🔧 管理员端 - {user['username']}")
        print("="*50)
        print("1. 商品管理")
        print("2. 库存管理")
        print("3. 用户历史管理")
        print("4. 沟通日志管理")
        print("5. 生成报价单")
        print("6. 用户管理")
        print("0. 退出登录")
        print("="*50)
        
        choice = ask_str("选择: ")
        
        if choice == '1':
            admin_product_menu(user)
        elif choice == '2':
            admin_inventory_menu(user)
        elif choice == '3':
            admin_history_menu(user)
        elif choice == '4':
            admin_communication_menu(user)
        elif choice == '5':
            generate_quotation()
        elif choice == '6':
            register_user()
        elif choice == '0':
            log_history(user['username'], "退出登录", user['role'])
            break
        else:
            print("❌ 无效选择")

# ==================== 主程序 ====================

def main():
    """主程序入口"""
    print("\n" + "="*50)
    print("🏢 融合仓库管理系统")
    print("="*50)
    print("正在初始化数据库...")
    init_db()
    
    while True:
        print("\n" + "="*50)
        print("1. 登录")
        print("2. 注册新用户")
        print("0. 退出系统")
        print("="*50)
        
        choice = ask_str("选择: ")
        
        if choice == '1':
            user = login()
            if user:
                if user['role'] == 'admin':
                    admin_menu(user)
                else:
                    customer_menu(user)
        elif choice == '2':
            register_user()
        elif choice == '0':
            print("\n👋 再见！")
            break
        else:
            print("❌ 无效选择")

if __name__ == "__main__":
    main()
