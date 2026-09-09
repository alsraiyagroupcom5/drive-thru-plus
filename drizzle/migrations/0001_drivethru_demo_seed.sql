-- ==========================================================
-- MASAR demo data
-- ==========================================================
INSERT INTO public.organizations (id, name_en, name_ar) VALUES
('11111111-1111-1111-1111-111111111111','Masar Hospitality Group','مجموعة مسار للضيافة');

INSERT INTO public.restaurants (id, organization_id, slug, name_en, name_ar, currency, tax_rate) VALUES
('22222222-2222-2222-2222-222222222222','11111111-1111-1111-1111-111111111111','masar','MASAR Grill','مسار جريل','QAR',0.0000);

INSERT INTO public.branches (id, restaurant_id, code, name_en, name_ar, city_en, city_ar, lat, lng, avg_prep_minutes, busy_level, is_open, phone) VALUES
('33333333-0001-0000-0000-000000000001','22222222-2222-2222-2222-222222222222','lusail','Lusail Boulevard','لوسيل بوليفارد','Lusail','لوسيل',25.4300,51.4900,8,2,true,'+974 4000 1001'),
('33333333-0001-0000-0000-000000000002','22222222-2222-2222-2222-222222222222','pearl','The Pearl Marina','اللؤلؤة مارينا','Doha','الدوحة',25.3700,51.5500,11,3,true,'+974 4000 1002'),
('33333333-0001-0000-0000-000000000003','22222222-2222-2222-2222-222222222222','wakra','Al Wakrah Corniche','الوكرة كورنيش','Al Wakrah','الوكرة',25.1700,51.6000,7,1,true,'+974 4000 1003');

INSERT INTO public.categories (id, restaurant_id, slug, name_en, name_ar, sort_order) VALUES
('44444444-0000-0000-0000-000000000001','22222222-2222-2222-2222-222222222222','burgers','Burgers','برجر',1),
('44444444-0000-0000-0000-000000000002','22222222-2222-2222-2222-222222222222','chicken','Chicken','دجاج',2),
('44444444-0000-0000-0000-000000000003','22222222-2222-2222-2222-222222222222','meals','Meals','وجبات',3),
('44444444-0000-0000-0000-000000000004','22222222-2222-2222-2222-222222222222','sandwiches','Sandwiches','سندويتشات',4),
('44444444-0000-0000-0000-000000000005','22222222-2222-2222-2222-222222222222','sides','Fries & Sides','بطاطا ومقبلات',5),
('44444444-0000-0000-0000-000000000006','22222222-2222-2222-2222-222222222222','drinks','Drinks','مشروبات',6),
('44444444-0000-0000-0000-000000000007','22222222-2222-2222-2222-222222222222','desserts','Desserts','حلويات',7),
('44444444-0000-0000-0000-000000000008','22222222-2222-2222-2222-222222222222','kids','Kids','أطفال',8);

INSERT INTO public.products (restaurant_id, category_id, name_en, name_ar, description_en, description_ar, price, image_url, calories, is_popular, is_new, is_spicy, prep_minutes, sort_order)
VALUES
-- Burgers
('22222222-2222-2222-2222-222222222222','44444444-0000-0000-0000-000000000001','Masar Double Burger','برجر مسار المزدوج','Two flame-grilled Angus patties, aged cheddar, house sauce','قطعتان أنجوس مشويتان، جبن شيدر معتق، صلصة البيت',34.00,'burger',780,true,false,false,7,1),
('22222222-2222-2222-2222-222222222222','44444444-0000-0000-0000-000000000001','Classic Angus Burger','برجر أنجوس كلاسيك','Single Angus patty, lettuce, tomato, pickles','قطعة أنجوس، خس، طماطم، مخلل',26.00,'burger',560,true,false,false,6,2),
('22222222-2222-2222-2222-222222222222','44444444-0000-0000-0000-000000000001','Truffle Mushroom Burger','برجر الترفل والمشروم','Swiss cheese, sautéed mushroom, truffle aioli','جبن سويسري، مشروم سوتيه، مايونيز ترفل',38.00,'burger',720,false,true,false,8,3),
('22222222-2222-2222-2222-222222222222','44444444-0000-0000-0000-000000000001','Fiery Jalapeño Burger','برجر الهالبينو الحار','Jalapeño, pepper jack, chipotle sauce','هالبينو، جبن حار، صلصة تشيبوتلي',32.00,'burger',690,false,false,true,7,4),
('22222222-2222-2222-2222-222222222222','44444444-0000-0000-0000-000000000001','Smoky BBQ Burger','برجر الباربكيو المدخن','Smoked beef, onion rings, BBQ glaze','لحم مدخن، حلقات بصل، صلصة باربكيو',33.00,'burger',810,false,false,false,7,5),
('22222222-2222-2222-2222-222222222222','44444444-0000-0000-0000-000000000001','Wagyu Signature','واغيو سيجنتشر','Premium wagyu blend, brioche bun, aged cheddar','خلطة واغيو فاخرة، خبز بريوش، شيدر معتق',58.00,'burger',840,false,true,false,10,6),
('22222222-2222-2222-2222-222222222222','44444444-0000-0000-0000-000000000001','Junior Burger','برجر جونيور','Small patty, cheese, ketchup','قطعة صغيرة، جبن، كاتشب',18.00,'burger',390,false,false,false,5,7),
('22222222-2222-2222-2222-222222222222','44444444-0000-0000-0000-000000000001','Cheese Lovers Burger','برجر عشاق الجبن','Triple cheese, creamy cheddar sauce','ثلاث أنواع جبن، صلصة شيدر كريمية',36.00,'burger',870,true,false,false,8,8),
-- Chicken
('22222222-2222-2222-2222-222222222222','44444444-0000-0000-0000-000000000002','Crispy Chicken Burger','برجر الدجاج المقرمش','Buttermilk fried chicken, slaw, garlic mayo','دجاج مقلي بالبترميلك، سلو، مايونيز ثوم',28.00,'chicken',640,true,false,false,7,1),
('22222222-2222-2222-2222-222222222222','44444444-0000-0000-0000-000000000002','Nashville Hot Chicken','دجاج ناشفيل الحار','Nashville spice blend, pickles, ranch','خلطة ناشفيل الحارة، مخلل، رانش',31.00,'chicken',700,false,false,true,8,2),
('22222222-2222-2222-2222-222222222222','44444444-0000-0000-0000-000000000002','Grilled Chicken Fillet','فيليه دجاج مشوي','Char-grilled fillet, lemon herb marinade','فيليه مشوي، تتبيلة الليمون والأعشاب',27.00,'chicken',420,false,false,false,9,3),
('22222222-2222-2222-2222-222222222222','44444444-0000-0000-0000-000000000002','Chicken Tenders (5 pcs)','أصابع دجاج (٥ قطع)','Hand-breaded tenders with dip','أصابع دجاج مغلفة يدوياً مع صوص',24.00,'chicken',520,true,false,false,6,4),
('22222222-2222-2222-2222-222222222222','44444444-0000-0000-0000-000000000002','Chicken Popcorn','بوب كورن دجاج','Bite-size crispy chicken','قطع دجاج صغيرة مقرمشة',19.00,'chicken',450,false,false,false,5,5),
('22222222-2222-2222-2222-222222222222','44444444-0000-0000-0000-000000000002','Zinger Deluxe','زنجر ديلوكس','Spicy fillet, double cheese','فيليه حار، جبن مضاعف',30.00,'chicken',680,false,false,true,7,6),
('22222222-2222-2222-2222-222222222222','44444444-0000-0000-0000-000000000002','Buffalo Wings (8 pcs)','أجنحة بافلو (٨ قطع)','Tossed in buffalo sauce','مغطاة بصلصة البافلو',29.00,'chicken',610,false,true,true,9,7),
-- Meals
('22222222-2222-2222-2222-222222222222','44444444-0000-0000-0000-000000000003','Double Burger Meal','وجبة البرجر المزدوج','Double burger + fries + drink','برجر مزدوج + بطاطا + مشروب',41.00,'meal',1180,true,false,false,9,1),
('22222222-2222-2222-2222-222222222222','44444444-0000-0000-0000-000000000003','Crispy Chicken Meal','وجبة الدجاج المقرمش','Crispy chicken + fries + drink','دجاج مقرمش + بطاطا + مشروب',35.00,'meal',1040,true,false,false,9,2),
('22222222-2222-2222-2222-222222222222','44444444-0000-0000-0000-000000000003','Wagyu Signature Meal','وجبة واغيو سيجنتشر','Wagyu burger + truffle fries + drink','برجر واغيو + بطاطا ترفل + مشروب',68.00,'meal',1320,false,true,false,12,3),
('22222222-2222-2222-2222-222222222222','44444444-0000-0000-0000-000000000003','Family Box','بوكس العائلة','4 burgers, 2 large fries, 4 drinks','٤ برجر، ٢ بطاطا كبيرة، ٤ مشروبات',139.00,'meal',3600,false,false,false,15,4),
('22222222-2222-2222-2222-222222222222','44444444-0000-0000-0000-000000000003','Tenders Meal','وجبة أصابع الدجاج','5 tenders + fries + drink','٥ أصابع دجاج + بطاطا + مشروب',33.00,'meal',960,false,false,false,8,5),
('22222222-2222-2222-2222-222222222222','44444444-0000-0000-0000-000000000003','Wings Meal','وجبة الأجنحة','8 wings + fries + drink','٨ أجنحة + بطاطا + مشروب',38.00,'meal',1120,false,false,true,10,6),
-- Sandwiches
('22222222-2222-2222-2222-222222222222','44444444-0000-0000-0000-000000000004','Steak Sandwich','سندويتش ستيك','Sliced ribeye, caramelised onion','شرائح ريب آي، بصل مكرمل',42.00,'sandwich',720,false,false,false,9,1),
('22222222-2222-2222-2222-222222222222','44444444-0000-0000-0000-000000000004','Philly Cheese','فيلي تشيز','Beef, peppers, molten cheese','لحم، فلفل، جبن ذائب',37.00,'sandwich',760,false,false,false,9,2),
('22222222-2222-2222-2222-222222222222','44444444-0000-0000-0000-000000000004','Chicken Shawarma Roll','رول شاورما دجاج','Marinated chicken, garlic sauce','دجاج متبل، صلصة ثوم',22.00,'sandwich',540,true,false,false,6,3),
('22222222-2222-2222-2222-222222222222','44444444-0000-0000-0000-000000000004','Beef Shawarma Roll','رول شاورما لحم','Slow-roasted beef, tahini','لحم مشوي ببطء، طحينة',25.00,'sandwich',580,false,false,false,6,4),
('22222222-2222-2222-2222-222222222222','44444444-0000-0000-0000-000000000004','Halloumi Wrap','راب حلومي','Grilled halloumi, rocket, pesto','حلومي مشوي، جرجير، بيستو',24.00,'sandwich',480,false,true,false,6,5),
('22222222-2222-2222-2222-222222222222','44444444-0000-0000-0000-000000000004','Spicy Fish Sandwich','سندويتش سمك حار','Crispy fish, harissa mayo','سمك مقرمش، مايونيز هريسة',29.00,'sandwich',560,false,false,true,8,6),
-- Sides
('22222222-2222-2222-2222-222222222222','44444444-0000-0000-0000-000000000005','Classic Fries','بطاطا كلاسيك','Golden skin-on fries','بطاطا ذهبية بالقشرة',10.00,'fries',320,true,false,false,4,1),
('22222222-2222-2222-2222-222222222222','44444444-0000-0000-0000-000000000005','Large Fries','بطاطا كبيرة','Large portion, sea salt','حصة كبيرة، ملح بحري',14.00,'fries',480,true,false,false,4,2),
('22222222-2222-2222-2222-222222222222','44444444-0000-0000-0000-000000000005','Truffle Fries','بطاطا بالترفل','Truffle oil, parmesan, herbs','زيت ترفل، بارميزان، أعشاب',22.00,'fries',540,false,true,false,5,3),
('22222222-2222-2222-2222-222222222222','44444444-0000-0000-0000-000000000005','Loaded Cheese Fries','بطاطا بالجبن','Cheddar sauce, crispy onion','صلصة شيدر، بصل مقرمش',19.00,'fries',610,false,false,false,5,4),
('22222222-2222-2222-2222-222222222222','44444444-0000-0000-0000-000000000005','Onion Rings','حلقات البصل','Beer-battered, crisp','مقلية ومقرمشة',15.00,'fries',430,false,false,false,5,5),
('22222222-2222-2222-2222-222222222222','44444444-0000-0000-0000-000000000005','Mozzarella Sticks','أصابع الموزاريلا','Six sticks with marinara','ستة أصابع مع مارينارا',20.00,'fries',470,false,false,false,6,6),
('22222222-2222-2222-2222-222222222222','44444444-0000-0000-0000-000000000005','Garden Salad','سلطة الحديقة','Crisp greens, citrus dressing','خضار طازجة، صلصة حمضيات',16.00,'fries',180,false,false,false,4,7),
('22222222-2222-2222-2222-222222222222','44444444-0000-0000-0000-000000000005','Coleslaw','كول سلو','Creamy cabbage slaw','سلطة ملفوف كريمية',9.00,'fries',150,false,false,false,3,8),
-- Drinks
('22222222-2222-2222-2222-222222222222','44444444-0000-0000-0000-000000000006','Cola','كولا','Chilled classic cola','كولا كلاسيكية مثلجة',8.00,'drink',140,true,false,false,2,1),
('22222222-2222-2222-2222-222222222222','44444444-0000-0000-0000-000000000006','Diet Cola','كولا دايت','Zero sugar','خالية من السكر',8.00,'drink',0,false,false,false,2,2),
('22222222-2222-2222-2222-222222222222','44444444-0000-0000-0000-000000000006','Fresh Orange Juice','عصير برتقال طازج','Squeezed to order','يعصر عند الطلب',16.00,'drink',120,false,false,false,3,3),
('22222222-2222-2222-2222-222222222222','44444444-0000-0000-0000-000000000006','Fresh Lemon Mint','ليمون بالنعناع','Lemon, mint, crushed ice','ليمون، نعناع، ثلج مجروش',15.00,'drink',110,true,false,false,3,4),
('22222222-2222-2222-2222-222222222222','44444444-0000-0000-0000-000000000006','Karak Tea','شاي كرك','Qatari-style spiced tea','شاي كرك على الطريقة القطرية',7.00,'drink',90,true,false,false,3,5),
('22222222-2222-2222-2222-222222222222','44444444-0000-0000-0000-000000000006','Iced Latte','لاتيه مثلج','Double shot, cold milk','جرعتان إسبريسو، حليب بارد',18.00,'drink',160,false,false,false,3,6),
('22222222-2222-2222-2222-222222222222','44444444-0000-0000-0000-000000000006','Sparkling Water','مياه فوارة','330ml bottle','عبوة ٣٣٠ مل',7.00,'drink',0,false,false,false,1,7),
('22222222-2222-2222-2222-222222222222','44444444-0000-0000-0000-000000000006','Mango Smoothie','سموذي مانجو','Alphonso mango, yoghurt','مانجو ألفونسو، لبن',20.00,'drink',240,false,true,false,4,8),
-- Desserts
('22222222-2222-2222-2222-222222222222','44444444-0000-0000-0000-000000000007','Chocolate Lava Cake','كيكة الشوكولاتة البركانية','Warm centre, vanilla cream','قلب دافئ، كريمة فانيليا',22.00,'dessert',480,true,false,false,6,1),
('22222222-2222-2222-2222-222222222222','44444444-0000-0000-0000-000000000007','Lotus Cheesecake','تشيز كيك لوتس','Baked cheesecake, caramel crumb','تشيز كيك مخبوز، فتات كراميل',24.00,'dessert',520,true,false,false,4,2),
('22222222-2222-2222-2222-222222222222','44444444-0000-0000-0000-000000000007','Date Pudding','بودينج التمر','Local dates, toffee sauce','تمر محلي، صلصة توفي',21.00,'dessert',460,false,true,false,5,3),
('22222222-2222-2222-2222-222222222222','44444444-0000-0000-0000-000000000007','Vanilla Soft Serve','آيس كريم فانيليا','Classic swirl cone','كون فانيليا كلاسيكي',9.00,'dessert',210,false,false,false,2,4),
('22222222-2222-2222-2222-222222222222','44444444-0000-0000-0000-000000000007','Chocolate Shake','ميلك شيك شوكولاتة','Thick shake, whipped cream','شيك كثيف، كريمة مخفوقة',19.00,'dessert',420,false,false,false,4,5),
-- Kids
('22222222-2222-2222-2222-222222222222','44444444-0000-0000-0000-000000000008','Kids Burger Box','بوكس برجر الأطفال','Junior burger, small fries, juice','برجر صغير، بطاطا صغيرة، عصير',26.00,'kids',560,false,false,false,6,1),
('22222222-2222-2222-2222-222222222222','44444444-0000-0000-0000-000000000008','Kids Tenders Box','بوكس أصابع الأطفال','3 tenders, small fries, juice','٣ أصابع دجاج، بطاطا صغيرة، عصير',25.00,'kids',520,false,false,false,6,2),
('22222222-2222-2222-2222-222222222222','44444444-0000-0000-0000-000000000008','Kids Milk','حليب الأطفال','200ml fresh milk','حليب طازج ٢٠٠ مل',6.00,'kids',110,false,false,false,1,3);

-- modifiers for burgers & chicken
INSERT INTO public.product_modifiers (id, product_id, name_en, name_ar, kind, is_required, max_select, sort_order)
SELECT gen_random_uuid(), p.id, 'Bread','الخبز','single',true,1,1 FROM public.products p
JOIN public.categories c ON c.id = p.category_id WHERE c.slug IN ('burgers','chicken','sandwiches');
INSERT INTO public.modifier_options (modifier_id, name_en, name_ar, price_delta, is_default, sort_order)
SELECT m.id,'Regular bun','خبز عادي',0,true,1 FROM public.product_modifiers m WHERE m.name_en='Bread';
INSERT INTO public.modifier_options (modifier_id, name_en, name_ar, price_delta, is_default, sort_order)
SELECT m.id,'Brioche bun','خبز بريوش',2,false,2 FROM public.product_modifiers m WHERE m.name_en='Bread';
INSERT INTO public.modifier_options (modifier_id, name_en, name_ar, price_delta, is_default, sort_order)
SELECT m.id,'Lettuce wrap','لفافة خس',0,false,3 FROM public.product_modifiers m WHERE m.name_en='Bread';

INSERT INTO public.product_modifiers (id, product_id, name_en, name_ar, kind, is_required, max_select, sort_order)
SELECT gen_random_uuid(), p.id, 'Extras','إضافات','multi',false,5,2 FROM public.products p
JOIN public.categories c ON c.id = p.category_id WHERE c.slug IN ('burgers','chicken','sandwiches');
INSERT INTO public.modifier_options (modifier_id, name_en, name_ar, price_delta, sort_order)
SELECT m.id,'Extra patty','قطعة إضافية',12,1 FROM public.product_modifiers m WHERE m.name_en='Extras';
INSERT INTO public.modifier_options (modifier_id, name_en, name_ar, price_delta, sort_order)
SELECT m.id,'Extra cheese','جبن إضافي',4,2 FROM public.product_modifiers m WHERE m.name_en='Extras';
INSERT INTO public.modifier_options (modifier_id, name_en, name_ar, price_delta, sort_order)
SELECT m.id,'Jalapeño','هالبينو',3,3 FROM public.product_modifiers m WHERE m.name_en='Extras';
INSERT INTO public.modifier_options (modifier_id, name_en, name_ar, price_delta, sort_order)
SELECT m.id,'Extra sauce','صلصة إضافية',2,4 FROM public.product_modifiers m WHERE m.name_en='Extras';

INSERT INTO public.product_modifiers (id, product_id, name_en, name_ar, kind, is_required, max_select, sort_order)
SELECT gen_random_uuid(), p.id, 'Remove','بدون','multi',false,5,3 FROM public.products p
JOIN public.categories c ON c.id = p.category_id WHERE c.slug IN ('burgers','chicken','sandwiches');
INSERT INTO public.modifier_options (modifier_id, name_en, name_ar, price_delta, sort_order)
SELECT m.id,'No onion','بدون بصل',0,1 FROM public.product_modifiers m WHERE m.name_en='Remove';
INSERT INTO public.modifier_options (modifier_id, name_en, name_ar, price_delta, sort_order)
SELECT m.id,'No pickles','بدون مخلل',0,2 FROM public.product_modifiers m WHERE m.name_en='Remove';
INSERT INTO public.modifier_options (modifier_id, name_en, name_ar, price_delta, sort_order)
SELECT m.id,'No tomato','بدون طماطم',0,3 FROM public.product_modifiers m WHERE m.name_en='Remove';
INSERT INTO public.modifier_options (modifier_id, name_en, name_ar, price_delta, sort_order)
SELECT m.id,'No sauce','بدون صلصة',0,4 FROM public.product_modifiers m WHERE m.name_en='Remove';

-- size for drinks / fries
INSERT INTO public.product_modifiers (id, product_id, name_en, name_ar, kind, is_required, max_select, sort_order)
SELECT gen_random_uuid(), p.id, 'Size','الحجم','single',true,1,1 FROM public.products p
JOIN public.categories c ON c.id = p.category_id WHERE c.slug IN ('drinks');
INSERT INTO public.modifier_options (modifier_id, name_en, name_ar, price_delta, is_default, sort_order)
SELECT m.id,'Medium','وسط',0,true,1 FROM public.product_modifiers m WHERE m.name_en='Size';
INSERT INTO public.modifier_options (modifier_id, name_en, name_ar, price_delta, is_default, sort_order)
SELECT m.id,'Large','كبير',4,false,2 FROM public.product_modifiers m WHERE m.name_en='Size';

-- ---------- customers ----------
INSERT INTO public.customers (restaurant_id, phone, full_name, language, loyalty_points, total_orders, total_spent, created_at, last_order_at)
SELECT '22222222-2222-2222-2222-222222222222',
       '+9745' || lpad((1000000 + g)::text, 7, '0'),
       (ARRAY['Ahmed Al-Mansouri','Fatima Al-Kuwari','Mohammed Al-Sulaiti','Noora Al-Thani','Khalid Al-Emadi','Sara Al-Marri','Yousef Al-Naimi','Maryam Al-Hajri','Abdulla Al-Attiyah','Hessa Al-Dosari'])[1 + (g % 10)],
       CASE WHEN g % 3 = 0 THEN 'en' ELSE 'ar' END,
       (g * 37) % 900,
       1 + (g % 14),
       ((g * 53) % 2400) + 120,
       now() - ((g % 180) || ' days')::interval,
       now() - ((g % 21) || ' days')::interval
FROM generate_series(1,100) g;

INSERT INTO public.customer_vehicles (customer_id, nickname, plate, make, model, color, vehicle_type, is_default)
SELECT c.id,
       (ARRAY['My car','سيارتي','Family car','Work car'])[1 + (row_number() OVER () % 4)],
       (100000 + (row_number() OVER () * 37) % 800000)::text,
       (ARRAY['Toyota','Nissan','Lexus','GMC','Land Rover','Mercedes'])[1 + (row_number() OVER () % 6)],
       (ARRAY['Land Cruiser','Patrol','LX 600','Yukon','Defender','G-Class'])[1 + (row_number() OVER () % 6)],
       (ARRAY['Black','White','Silver','Grey','Blue'])[1 + (row_number() OVER () % 5)],
       'SUV', true
FROM public.customers c;

-- ---------- orders ----------
WITH base AS (
  SELECT g,
    (ARRAY['33333333-0001-0000-0000-000000000001','33333333-0001-0000-0000-000000000002','33333333-0001-0000-0000-000000000003'])[1 + (g % 3)]::uuid AS branch_id,
    (SELECT id FROM public.customers ORDER BY created_at, id OFFSET (g % 100) LIMIT 1) AS customer_id,
    CASE
      WHEN g % 20 = 0 THEN 'CANCELLED'
      WHEN g <= 6 THEN 'RECEIVED'
      WHEN g <= 14 THEN 'PREPARING'
      WHEN g <= 20 THEN 'READY'
      ELSE 'COMPLETED'
    END::public.order_status AS st,
    CASE WHEN g <= 20 THEN now() - ((g * 90) || ' seconds')::interval
         ELSE now() - ((g % 30) || ' days')::interval - ((g * 7 % 900) || ' minutes')::interval END AS created,
    round(((g * 41) % 180 + 28)::numeric, 2) AS total
  FROM generate_series(1,200) g
)
INSERT INTO public.orders (restaurant_id, branch_id, customer_id, vehicle_id, order_number, pickup_code, status, payment_status, payment_method, subtotal, tax, total, points_earned, customer_name, customer_phone, vehicle_snapshot, target_prep_minutes, created_at, ready_at, completed_at)
SELECT '22222222-2222-2222-2222-222222222222', b.branch_id, b.customer_id,
       (SELECT v.id FROM public.customer_vehicles v WHERE v.customer_id = b.customer_id LIMIT 1),
       'A' || nextval('public.order_seq'),
       lpad(((b.g * 7919) % 1000000)::text, 6, '0'),
       b.st,
       CASE WHEN b.st = 'CANCELLED' THEN 'FAILED' WHEN b.g % 4 = 0 THEN 'PENDING' ELSE 'PAID' END::public.payment_status,
       CASE WHEN b.g % 4 = 0 THEN 'PAY_AT_PICKUP' WHEN b.g % 3 = 0 THEN 'APPLE_PAY' ELSE 'CARD' END::public.payment_method,
       b.total, 0, b.total, floor(b.total)::int,
       c.full_name, c.phone,
       jsonb_build_object('plate', v.plate, 'make', v.make, 'model', v.model, 'color', v.color),
       8 + (b.g % 5),
       b.created,
       CASE WHEN b.st IN ('READY','COMPLETED') THEN b.created + interval '9 minutes' END,
       CASE WHEN b.st = 'COMPLETED' THEN b.created + interval '13 minutes' END
FROM base b
JOIN public.customers c ON c.id = b.customer_id
LEFT JOIN public.customer_vehicles v ON v.customer_id = b.customer_id;

INSERT INTO public.order_items (order_id, product_id, name_en, name_ar, quantity, unit_price, line_total)
SELECT o.id, p.id, p.name_en, p.name_ar, 1 + (abs(hashtext(o.id::text || p.id::text)) % 2), p.price, p.price
FROM public.orders o
JOIN LATERAL (
  SELECT * FROM public.products ORDER BY md5(id::text || o.id::text) LIMIT 3
) p ON true;

UPDATE public.orders o SET subtotal = s.sum_total, total = s.sum_total
FROM (SELECT order_id, sum(unit_price * quantity) AS sum_total FROM public.order_items GROUP BY order_id) s
WHERE s.order_id = o.id;

UPDATE public.order_items SET line_total = unit_price * quantity;
