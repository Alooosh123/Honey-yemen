import fs from 'fs';
import path from 'path';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'MERCHANT' | 'LAB_TECHNICIAN' | 'CUSTOMER';
  shopId?: string;
  phone?: string;
}

export interface HoneyDiseaseBenefit {
  disease: string;
  description: string;
}

export interface HoneyTypeInfo {
  id: string;
  nameAr: string;
  nameEn: string;
  description: string;
  region: string;
  therapeuticBenefits: string[];
  recommendedUses: string[];
  standardCharacteristics: {
    fructose: number | null; // %
    glucose: number | null;  // %
    sucrose: number | null;  // %
    moisture: number | null; // %
    hmfMax: number;   // mg/kg
    density: number | null;  // g/cm3
  };
}

export interface HoneySampleRecord {
  id: string;
  batchNumber: string;
  barcode: string;
  qrCodeDataUrl?: string;
  honeyType: string;
  honeyTypeNameAr: string;
  originRegion: string;
  shopId: string;
  shopName: string;
  testedAt: string;
  operatorName: string;
  analysisStatus?: 'NOT_EVALUATED' | 'VERIFIED' | 'REJECTED' | 'DEMO';
  classification: string;
  confidence: number | null;
  qualityScore: number | null;
  isPure: boolean | null;
  chemicalAnalysis: {
    fructose: number;
    glucose: number;
    sucrose: number;
    moisture: number;
    hmf: number | null;
    density: number;
    vocIndex: number | null;
    colorSpectrumChannels: number[];
    nirPeakAbsorbance: number | null;
  };
  sensorData: {
    nirSummary: { points: number; minWl: number; maxWl: number };
    vis11Channels: number[];
    uvResponse: { uva: number; uvb: number; hmfIndex: number };
    thermalAverage: number;
    densityValue: number;
    vocGasLevel: number | null;
    rawReadings?: {
      color: { r: number; g: number; b: number };
      uv: { raw: number; unit: string };
      ir: { temperatureC: number };
      acquiredAt: string;
      device: { port: string; baudRate: number };
    };
  };
  pdfUrl?: string;
}

export interface Shop {
  id: string;
  name: string;
  ownerName: string;
  email: string;
  phone: string;
  city: string;
  region: string;
  logo: string;
  isVerified: boolean;
  isVisibleInSearch: boolean; // Managed by SaaS Admin
  subscriptionPlan: 'STARTER' | 'COMMERCIAL' | 'ENTERPRISE';
  subscriptionStatus: 'ACTIVE' | 'EXPIRED' | 'TRIAL';
  scansRemaining: number;
  totalScansPerformed: number;
  rating: number;
  createdAt: string;
}

export interface HoneyProduct {
  id: string;
  nameAr: string;
  nameEn: string;
  honeyTypeId: string;
  shopId: string;
  shopName: string;
  sampleId: string;
  barcode: string;
  price: number; // in USD or SAR
  currency: string;
  weightGrams: number;
  stockQuantity: number;
  purityScore: number;
  treatedDiseases: string[];
  imageUrl: string;
  descriptionAr: string;
  badge: string;
  rating: number;
  reviewsCount: number;
}

export interface OrderItem {
  productId: string;
  productName: string;
  honeyType: string;
  quantity: number;
  unitPrice: number;
  barcode: string;
}

export interface Order {
  id: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  deliveryAddress: string;
  city: string;
  items: OrderItem[];
  totalAmount: number;
  status: 'PENDING' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED';
  orderDate: string;
}

export interface SaasPlan {
  id: string;
  planKey: 'STARTER' | 'COMMERCIAL' | 'ENTERPRISE';
  nameAr: string;
  nameEn: string;
  priceMonthly: number;
  scanQuota: number;
  features: string[];
  isPopular?: boolean;
}

class DatabaseStore {
  private dataFilePath: string;
  private users: User[] = [];
  private shops: Shop[] = [];
  private honeyTypes: HoneyTypeInfo[] = [];
  private samples: HoneySampleRecord[] = [];
  private products: HoneyProduct[] = [];
  private orders: Order[] = [];
  private plans: SaasPlan[] = [];

  constructor() {
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    this.dataFilePath = path.join(dataDir, 'honey_db.json');
    this.loadOrSeed();
  }

  private loadOrSeed() {
    if (fs.existsSync(this.dataFilePath)) {
      try {
        const raw = fs.readFileSync(this.dataFilePath, 'utf-8');
        const parsed = JSON.parse(raw);
        this.users = parsed.users || [];
        this.shops = parsed.shops || [];
        this.honeyTypes = parsed.honeyTypes || [];
        this.samples = parsed.samples || [];
        this.products = parsed.products || [];
        this.orders = parsed.orders || [];
        this.plans = parsed.plans || [];
        return;
      } catch (err) {
        console.error('Error reading honey_db.json, seeding defaults...', err);
      }
    }
    this.seedDefaults();
    this.save();
  }

  public save() {
    try {
      const payload = {
        users: this.users,
        shops: this.shops,
        honeyTypes: this.honeyTypes,
        samples: this.samples,
        products: this.products,
        orders: this.orders,
        plans: this.plans,
      };
      fs.writeFileSync(this.dataFilePath, JSON.stringify(payload, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error saving honey_db.json:', err);
    }
  }

  private seedDefaults() {
    this.users = [
      {
        id: 'user-admin',
        name: 'مدير المنظومة المركزية',
        email: 'admin@honeyquality.io',
        role: 'ADMIN',
        phone: '+967 770 000 001',
      },
      {
        id: 'user-merchant-1',
        name: 'الشيخ عبد الله الدوعني',
        email: 'merchant@sidr-royale.com',
        role: 'MERCHANT',
        shopId: 'shop-1',
        phone: '+967 771 234 567',
      },
      {
        id: 'user-tech-1',
        name: 'م. أحمد باصديق (كبير كيميائيي المختبر)',
        email: 'tech@lab.io',
        role: 'LAB_TECHNICIAN',
        phone: '+967 777 888 999',
      },
      {
        id: 'user-customer-1',
        name: 'سالم الكندي (مشتري)',
        email: 'salem@example.com',
        role: 'CUSTOMER',
        phone: '+966 50 123 4567',
      },
    ];

    this.plans = [
      {
        id: 'plan-starter',
        planKey: 'STARTER',
        nameAr: 'باقة النحال المبتدئ',
        nameEn: 'Starter Beekeeper',
        priceMonthly: 79,
        scanQuota: 50,
        features: [
          '50 فحص مخبري شهرياً بدقة 100%',
          'إصدار باركود فحص وشهادات PDF معتمدة',
          'إدراج في تطبيق البحث للعملاء',
          'دعم فني عبر البريد الإلكتروني',
        ],
      },
      {
        id: 'plan-commercial',
        planKey: 'COMMERCIAL',
        nameAr: 'باقة المتجر التجاري المعتمد',
        nameEn: 'Verified Merchant Commercial',
        priceMonthly: 199,
        scanQuota: 200,
        isPopular: true,
        features: [
          '200 فحص مخبري شهرياً بأولوية قصوى',
          'شارة "متجر موثق بنقاء 100%" ومركز أول بالبحث',
          'متجر إلكتروني متكامل داخل التطبيق مع إدارة الطلبات',
          'ربط الباركود التلقائي بالمخزون والمبيعات',
          'دعم فني مخصص على مدار الساعة',
        ],
      },
      {
        id: 'plan-enterprise',
        planKey: 'ENTERPRISE',
        nameAr: 'باقة المختبر والمؤسسات الكبرى',
        nameEn: 'Enterprise Lab & Exports',
        priceMonthly: 499,
        scanQuota: 1000,
        features: [
          '1000 فحص مخبري شهرياً + فحوصات إضافية مرنة',
          'ربط برمجية الأجهزة الطرفية عبر API مباشر',
          'شهادات منشأ دولية وتصدير معتمدة بتقنية الباركود المشفر',
          'لوحة إحصائيات متقدمة وتتبع سلاسل الإمداد (Supply Chain)',
          'مدير حساب وتقارير كيميائية موسعة (GC-MS / FT-IR)',
        ],
      },
    ];

    this.shops = [
      {
        id: 'shop-1',
        name: 'مناحل وادي دوعن الملكية',
        ownerName: 'الشيخ عبد الله الدوعني',
        email: 'merchant@sidr-royale.com',
        phone: '+967 771 234 567',
        city: 'المكلا - حضرموت',
        region: 'وادي دوعن',
        logo: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=300&q=80',
        isVerified: true,
        isVisibleInSearch: true,
        subscriptionPlan: 'COMMERCIAL',
        subscriptionStatus: 'ACTIVE',
        scansRemaining: 184,
        totalScansPerformed: 66,
        rating: 4.95,
        createdAt: '2025-01-15T10:00:00Z',
      },
      {
        id: 'shop-2',
        name: 'متجر عسل العصيمي الفاخر',
        ownerName: 'أبو هاشم العصيمي',
        email: 'osaimi@honey.com',
        phone: '+967 773 987 654',
        city: 'صنعاء / عمران',
        region: 'العصيمات',
        logo: 'https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?auto=format&fit=crop&w=300&q=80',
        isVerified: true,
        isVisibleInSearch: true,
        subscriptionPlan: 'COMMERCIAL',
        subscriptionStatus: 'ACTIVE',
        scansRemaining: 142,
        totalScansPerformed: 58,
        rating: 4.92,
        createdAt: '2025-02-01T12:00:00Z',
      },
      {
        id: 'shop-3',
        name: 'مناحل إكسير جردان للسمر والسدر',
        ownerName: 'مبارك بن سريع الشبواني',
        email: 'jardan@honey.com',
        phone: '+967 775 444 333',
        city: 'عتق - شبوة',
        region: 'وادي جردان',
        logo: 'https://images.unsplash.com/photo-1471943311424-646960669fbc?auto=format&fit=crop&w=300&q=80',
        isVerified: true,
        isVisibleInSearch: true,
        subscriptionPlan: 'ENTERPRISE',
        subscriptionStatus: 'ACTIVE',
        scansRemaining: 890,
        totalScansPerformed: 110,
        rating: 4.98,
        createdAt: '2025-01-05T08:00:00Z',
      },
      {
        id: 'shop-4',
        name: 'واحة تهامة للعسل الشوكي والسلام',
        ownerName: 'حسن التهامي',
        email: 'tihama@honey.com',
        phone: '+967 772 111 222',
        city: 'الحديدة',
        region: 'سهل تهامة',
        logo: 'https://images.unsplash.com/photo-1587049352847-4a222e784d38?auto=format&fit=crop&w=300&q=80',
        isVerified: true,
        isVisibleInSearch: true,
        subscriptionPlan: 'STARTER',
        subscriptionStatus: 'ACTIVE',
        scansRemaining: 34,
        totalScansPerformed: 16,
        rating: 4.88,
        createdAt: '2025-02-10T14:00:00Z',
      },
    ];

    this.honeyTypes = [
      {
        id: 'type-sidr-doani',
        nameAr: 'عسل سدر دوعني ملكي',
        nameEn: 'Royal Doani Sidr Honey',
        description: 'من أندر وأغلى أنواع العسل في العالم، يُستخرج من أزهار أشجار السدر (النبق) في أودية دوعن بحضرموت، يتميز بلون كهرماني داكن ورائحة عطرية فواحة ولزوجة وكثافة عالية جداً.',
        region: 'وادي دوعن، حضرموت',
        therapeuticBenefits: [
          'علاج قرحة المعدة والتهاب الاثني عشر وجرثومة المعدة (Helicobacter pylori)',
          'تنشيط وظائف الكبد وحمايته من التليف',
          'رفع كفاءة الجهاز المناعي ومكافحة الأورام والخلايا الشاذة',
          'علاج الضعف العام والإرهاق المزمن وتعزيز الخصوبة',
          'مطهر فائق ومسرع لالتئام الجروح الصعبة والحروق الجلدية',
        ],
        recommendedUses: ['ملعقة كبيرة على الريق صباحاً مذابة بنصف كوب ماء دافئ', 'الاستخدام الموضعي على الحروق والتقرحات'],
        standardCharacteristics: {
          fructose: 41.5,
          glucose: 31.0,
          sucrose: 0.8,
          moisture: 15.2,
          hmfMax: 5.0,
          density: 1.43,
        },
      },
      {
        id: 'type-sidr-osaimi',
        nameAr: 'عسل سدر عصيمي فاخر',
        nameEn: 'Premium Osaimi Sidr Honey',
        description: 'يُجنى من جبال العصيمات الشاهقة، معروف بنقائه وطعمه اللاذع اللذيذ وقوته العلاجية الفائقة للأجهزة التنفسية والقولون.',
        region: 'منطقة العصيمات، عمران',
        therapeuticBenefits: [
          'علاج التهابات الجهاز التنفسي المزمنة، الربو، والسعال الديكي',
          'تهدئة متلازمة القولون العصبي وتنظيم حركة الأمعاء',
          'تقوية عضلة القلب والوقاية من تصلب الشرايين',
          'مضاد حيوي طبيعي قوي جداً ضد البكتيريا المقاومة',
        ],
        recommendedUses: ['ملعقة صباحاً ومساءً', 'خلطه مع حبة البركة لتقوية المناعة التنفسية'],
        standardCharacteristics: {
          fructose: 40.8,
          glucose: 31.8,
          sucrose: 0.9,
          moisture: 15.6,
          hmfMax: 4.5,
          density: 1.42,
        },
      },
      {
        id: 'type-samr-hadrami',
        nameAr: 'عسل سمر حضرمي نقي',
        nameEn: 'Pure Hadrami Samr Honey',
        description: 'يُستخلص من أشجار السمر (الطلح/السنط)، يتميز بلونه الأحمر المائل إلى السواد وغناه الهائل بمعدن الحديد ومضادات الأكسدة.',
        region: 'أودية حضرموت وشبوة',
        therapeuticBenefits: [
          'العلاج الأسرع لفقر الدم الحاد (الأنيميا) وزيادة نسبة الهيموجلوبين',
          'أمراض الكبد الفيروسية وتنشيط إنزيمات الكبد',
          'تخفيف آلام المفاصل والروماتيزم والتهابات العظام',
          'مفيد لمرضى السكري باعتدال لقلة نسبة السكروز فيه وسهولة تمثيله',
        ],
        recommendedUses: ['ملعقة كبيرة يومياً مع الحليب الدافئ أو الماء'],
        standardCharacteristics: {
          fructose: 39.5,
          glucose: 29.8,
          sucrose: 0.4,
          moisture: 16.0,
          hmfMax: 6.0,
          density: 1.41,
        },
      },
      {
        id: 'type-salam-tihama',
        nameAr: 'عسل سلام تهامي صافي',
        nameEn: 'Tihama Salam Honey',
        description: 'يُنتج من أزهار شجر السلام الشوكي في سهول تهامة، خفيف اللزوجة وقليل السكريات الضارة، ويعتبر الاختيار المفضل لمرضى السكر والكلى.',
        region: 'سهول تهامة، اليمن',
        therapeuticBenefits: [
          'صديق ومثالي لمرضى السكري لتنظيم مستويات السكر بالدم',
          'تنشيط الكلى والمساعدة في إذابة وترسيب الحصوات الخفيفة',
          'تنظيم ضغط الدم وتحسين الدورة الدموية',
          'تخفيف حموضة المعدة وسوء الهضم',
        ],
        recommendedUses: ['ملعقة متوسطة قبل الوجبات بنصف ساعة'],
        standardCharacteristics: {
          fructose: 43.0,
          glucose: 27.5,
          sucrose: 0.2,
          moisture: 16.3,
          hmfMax: 5.0,
          density: 1.41,
        },
      },
      {
        id: 'type-marai-mountain',
        nameAr: 'عسل مراعي جبلي طبيعي',
        nameEn: 'Wild Mountain Marai Honey',
        description: 'عسل متعدد الأزهار البرية الجبلية، طعمه معتدل ولونه عنبري ذهبي، ممتاز لغذاء العائلة والأطفال والرياضيين.',
        region: 'المرتفعات الجبلية الوسطى',
        therapeuticBenefits: [
          'تعزيز نمو الأطفال ومدهم بالطاقة والفيتامينات الطبيعية',
          'علاج نزلات البرد، الزكام، والتهاب الحلق واللوزتين',
          'مقاومة الأرق واضطرابات النوم والتوتر العصبي',
          'تحسين اللياقة البدنية والتعافي بعد التمارين الشاقة',
        ],
        recommendedUses: ['استخدامه كبديل طبيعي للسكر في المشروبات اليومية'],
        standardCharacteristics: {
          fructose: 38.5,
          glucose: 33.0,
          sucrose: 1.2,
          moisture: 17.0,
          hmfMax: 7.0,
          density: 1.40,
        },
      },
      {
        id: 'type-sal-spicy',
        nameAr: 'عسل صال يمني حار',
        nameEn: 'Yemeni Spicy Sal Honey',
        description: 'عسل نادر وفريد يتميز بحرقة لاذعة في الحلق تستمر لدقائق بعد تناوله، يُعرف عالمياً بقدرته الفائقة على إذابة البلغم وتوسيع الشعب الهوائية.',
        region: 'محافظة إب والضالع',
        therapeuticBenefits: [
          'علاج حالات الربو الحاد والتهاب الشعب الهوائية الصدري',
          'طرد البلغم المتراكم وتنقية القصبات الهوائية للرئتين',
          'تقوية الأعصاب ومكافحة الخمول والكسل الشديد',
          'مضاد قوي للالتهابات الفيروسية الحادة',
        ],
        recommendedUses: ['نصف ملعقة صغيرة فقط تؤخذ ببطء في الحلق'],
        standardCharacteristics: {
          fructose: 39.2,
          glucose: 30.5,
          sucrose: 0.5,
          moisture: 16.4,
          hmfMax: 6.0,
          density: 1.41,
        },
      },
    ];

    // Pre-populate certified laboratory tested honey batches
    this.samples = [
      {
        id: 'sample-001',
        batchNumber: 'BCH-DOANI-9821',
        barcode: 'HONEY-DOANI-9821-CERT100',
        honeyType: 'Sidr Doani',
        honeyTypeNameAr: 'عسل سدر دوعني ملكي نخب أول',
        originRegion: 'وادي دوعن، حضرموت',
        shopId: 'shop-1',
        shopName: 'مناحل وادي دوعن الملكية',
        testedAt: '2025-02-12T09:30:00Z',
        operatorName: 'م. أحمد باصديق (كبير كيميائيي المختبر)',
        classification: 'Sidr (سدر ملكي نقي)',
        confidence: 1.0,
        qualityScore: 99.8,
        isPure: true,
        chemicalAnalysis: {
          fructose: 41.8,
          glucose: 31.2,
          sucrose: 0.7,
          moisture: 15.1,
          hmf: 3.2,
          density: 1.43,
          vocIndex: 88.5,
          colorSpectrumChannels: [18, 42, 65, 112, 185, 230, 245, 210, 175, 130, 80],
          nirPeakAbsorbance: 0.94,
        },
        sensorData: {
          nirSummary: { points: 100, minWl: 1350, maxWl: 2500 },
          vis11Channels: [18, 42, 65, 112, 185, 230, 245, 210, 175, 130, 80],
          uvResponse: { uva: 142.5, uvb: 14.8, hmfIndex: 3.2 },
          thermalAverage: 25.4,
          densityValue: 1.43,
          vocGasLevel: 88.5,
        },
        pdfUrl: '/api/scan/reports/sample-001/pdf',
      },
      {
        id: 'sample-002',
        batchNumber: 'BCH-OSAIMI-4402',
        barcode: 'HONEY-OSAIMI-4402-CERT100',
        honeyType: 'Sidr Osaimi',
        honeyTypeNameAr: 'عسل سدر عصيمي فاخر قطفة أولى',
        originRegion: 'جبال العصيمات، عمران',
        shopId: 'shop-2',
        shopName: 'متجر عسل العصيمي الفاخر',
        testedAt: '2025-02-14T11:15:00Z',
        operatorName: 'م. أحمد باصديق (كبير كيميائيي المختبر)',
        classification: 'Sidr (سدر عصيمي أصلي)',
        confidence: 1.0,
        qualityScore: 99.5,
        isPure: true,
        chemicalAnalysis: {
          fructose: 40.9,
          glucose: 31.6,
          sucrose: 0.8,
          moisture: 15.5,
          hmf: 3.9,
          density: 1.42,
          vocIndex: 82.0,
          colorSpectrumChannels: [22, 50, 78, 125, 190, 235, 240, 195, 160, 115, 70],
          nirPeakAbsorbance: 0.91,
        },
        sensorData: {
          nirSummary: { points: 100, minWl: 1350, maxWl: 2500 },
          vis11Channels: [22, 50, 78, 125, 190, 235, 240, 195, 160, 115, 70],
          uvResponse: { uva: 138.0, uvb: 13.9, hmfIndex: 3.9 },
          thermalAverage: 25.2,
          densityValue: 1.42,
          vocGasLevel: 82.0,
        },
        pdfUrl: '/api/scan/reports/sample-002/pdf',
      },
      {
        id: 'sample-003',
        batchNumber: 'BCH-SAMR-7719',
        barcode: 'HONEY-SAMR-7719-CERT100',
        honeyType: 'Samr Hadrami',
        honeyTypeNameAr: 'عسل سمر وادي جردان علاج الأنيميا',
        originRegion: 'وادي جردان، شبوة',
        shopId: 'shop-3',
        shopName: 'مناحل إكسير جردان للسمر والسدر',
        testedAt: '2025-02-18T14:40:00Z',
        operatorName: 'م. أحمد باصديق (كبير كيميائيي المختبر)',
        classification: 'Samr (سمر نقي عالي الحديد)',
        confidence: 1.0,
        qualityScore: 99.4,
        isPure: true,
        chemicalAnalysis: {
          fructose: 39.7,
          glucose: 29.6,
          sucrose: 0.3,
          moisture: 15.9,
          hmf: 4.8,
          density: 1.41,
          vocIndex: 79.4,
          colorSpectrumChannels: [40, 75, 110, 160, 210, 240, 215, 170, 130, 95, 60],
          nirPeakAbsorbance: 0.88,
        },
        sensorData: {
          nirSummary: { points: 100, minWl: 1350, maxWl: 2500 },
          vis11Channels: [40, 75, 110, 160, 210, 240, 215, 170, 130, 95, 60],
          uvResponse: { uva: 155.0, uvb: 16.1, hmfIndex: 4.8 },
          thermalAverage: 25.1,
          densityValue: 1.41,
          vocGasLevel: 79.4,
        },
        pdfUrl: '/api/scan/reports/sample-003/pdf',
      },
    ];

    // Marketplace Products ready for customer browsing & purchase
    this.products = [
      {
        id: 'prod-001',
        nameAr: 'عسل سدر دوعني ملكي فاخر (1 كجم) - موثق مخبرياً',
        nameEn: 'Royal Doani Sidr Honey (1kg)',
        honeyTypeId: 'type-sidr-doani',
        shopId: 'shop-1',
        shopName: 'مناحل وادي دوعن الملكية',
        sampleId: 'sample-001',
        barcode: 'HONEY-DOANI-9821-CERT100',
        price: 120,
        currency: 'USD',
        weightGrams: 1000,
        stockQuantity: 42,
        purityScore: 99.8,
        treatedDiseases: [
          'قرحة المعدة والقولون',
          'جرثومة المعدة (H. Pylori)',
          'أمراض الكبد وتنشيط الإنزيمات',
          'تقوية المناعة ومكافحة الأورام',
          'الضعف العام والخصوبة',
        ],
        imageUrl: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=600&q=80',
        descriptionAr: 'عسل سدر دوعني ملكي نقي 100% مستخرج من مناحل وادي دوعن بحضرموت، خاضع للفحص الكامل بـ 6 مستشعرات طيفية وذكاء اصطناعي بنسبة نقاء 99.8%. مصحوب بباركود وشهادة فحص مخبرية رسمية.',
        badge: 'أعلى نقاء موثق 100%',
        rating: 4.98,
        reviewsCount: 147,
      },
      {
        id: 'prod-002',
        nameAr: 'عسل سدر عصيمي جبلي نقي (1 كجم) - تنفسي ومناعي',
        nameEn: 'Osaimi Sidr Honey (1kg)',
        honeyTypeId: 'type-sidr-osaimi',
        shopId: 'shop-2',
        shopName: 'متجر عسل العصيمي الفاخر',
        sampleId: 'sample-002',
        barcode: 'HONEY-OSAIMI-4402-CERT100',
        price: 95,
        currency: 'USD',
        weightGrams: 1000,
        stockQuantity: 28,
        purityScore: 99.5,
        treatedDiseases: [
          'الربو والحساسية الصدرية',
          'التهاب الجيوب الأنفية والسعال',
          'القولون العصبي وعسر الهضم',
          'تقوية عضلة القلب والشرايين',
        ],
        imageUrl: 'https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?auto=format&fit=crop&w=600&q=80',
        descriptionAr: 'عسل عصيمي من قمم جبال العصيمات، مضاد حيوي طبيعي فائق الشهرة لأمراض الصدر والجهاز التنفسي والقولون. فحص طيفي مؤكد.',
        badge: 'الأكثر مبيعاً للصدر والربو',
        rating: 4.94,
        reviewsCount: 96,
      },
      {
        id: 'prod-003',
        nameAr: 'عسل سمر جرداني شبواني نخب أول (1 كجم) - علاج فقر الدم',
        nameEn: 'Hadrami Samr Honey (1kg)',
        honeyTypeId: 'type-samr-hadrami',
        shopId: 'shop-3',
        shopName: 'مناحل إكسير جردان للسمر والسدر',
        sampleId: 'sample-003',
        barcode: 'HONEY-SAMR-7719-CERT100',
        price: 75,
        currency: 'USD',
        weightGrams: 1000,
        stockQuantity: 35,
        purityScore: 99.4,
        treatedDiseases: [
          'فقر الدم الحاد (الأنيميا)',
          'فيروسات الكبد وتنشيط وظائفه',
          'آلام المفاصل والروماتيزم',
          'تنظيم السكر بجرعات مقننة',
        ],
        imageUrl: 'https://images.unsplash.com/photo-1471943311424-646960669fbc?auto=format&fit=crop&w=600&q=80',
        descriptionAr: 'عسل سمر خالص من وادي جردان، غني بالحديد والمعادن لرفع كريات الدم الحمراء ومساعدة مرضى الكبد والأنيميا.',
        badge: 'الأقوى في علاج الأنيميا والحديد',
        rating: 4.96,
        reviewsCount: 82,
      },
      {
        id: 'prod-004',
        nameAr: 'عسل سلام تهامي صافي (1 كجم) - خفيف وصديق السكري',
        nameEn: 'Tihama Salam Honey (1kg)',
        honeyTypeId: 'type-salam-tihama',
        shopId: 'shop-4',
        shopName: 'واحة تهامة للعسل الشوكي والسلام',
        sampleId: 'sample-001',
        barcode: 'HONEY-TIHAMA-3100-CERT100',
        price: 60,
        currency: 'USD',
        weightGrams: 1000,
        stockQuantity: 50,
        purityScore: 99.1,
        treatedDiseases: [
          'صديق لمرضى السكري والوقاية',
          'أمراض الكلى والمسالك البولية',
          'تنظيم ضغط الدم والدورة الدموية',
          'حموضة المعدة وسوء الهضم',
        ],
        imageUrl: 'https://images.unsplash.com/photo-1587049352847-4a222e784d38?auto=format&fit=crop&w=600&q=80',
        descriptionAr: 'عسل سلام شوكي من سهول تهامة، سكريات طبيعية سهلة الامتصاص ومنخفضة السكروز بنسبة 0.2% فقط، الأمثل لمرضى السكري وصحة الكلى.',
        badge: 'الصديق الأول لمرضى السكري',
        rating: 4.89,
        reviewsCount: 54,
      },
      {
        id: 'prod-005',
        nameAr: 'عسل مراعي جبلي طبيعي متعدد الأزهار (1 كجم) - للأطفال والأسرة',
        nameEn: 'Wild Mountain Marai Honey (1kg)',
        honeyTypeId: 'type-marai-mountain',
        shopId: 'shop-2',
        shopName: 'متجر عسل العصيمي الفاخر',
        sampleId: 'sample-002',
        barcode: 'HONEY-MARAI-5510-CERT100',
        price: 45,
        currency: 'USD',
        weightGrams: 1000,
        stockQuantity: 65,
        purityScore: 98.9,
        treatedDiseases: [
          'صحة ونمو الأطفال والمناعة',
          'نزلات البرد والتهاب اللوزتين',
          'محاربة الأرق واضطرابات النوم',
          'النشاط الرياضي والحيوية',
        ],
        imageUrl: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=600&q=80',
        descriptionAr: 'عسل مراعي طبيعي من أزهار الجبال، غذاء متكامل لكل أفراد الأسرة ولذيذ الطعم وغني بالفيتامينات.',
        badge: 'عسل العائلة والأطفال المفضل',
        rating: 4.88,
        reviewsCount: 112,
      },
    ];

    this.orders = [
      {
        id: 'ORD-2025-101',
        customerName: 'سالم الكندي',
        customerPhone: '+966 50 123 4567',
        customerEmail: 'salem@example.com',
        deliveryAddress: 'حي الياسمين، الرياض',
        city: 'الرياض',
        items: [
          {
            productId: 'prod-001',
            productName: 'عسل سدر دوعني ملكي فاخر (1 كجم) - موثق مخبرياً',
            honeyType: 'Sidr Doani',
            quantity: 2,
            unitPrice: 120,
            barcode: 'HONEY-DOANI-9821-CERT100',
          },
        ],
        totalAmount: 240,
        status: 'CONFIRMED',
        orderDate: '2025-02-18T16:20:00Z',
      },
    ];
  }

  // --- CRUD and Accessors ---
  public getUsers() { return this.users; }
  public getShops() { return this.shops; }
  public getHoneyTypes() { return this.honeyTypes; }
  public getSamples() { return this.samples; }
  public getProducts() { return this.products; }
  public getOrders() { return this.orders; }
  public getPlans() { return this.plans; }

  public getShopById(id: string) {
    return this.shops.find((s) => s.id === id);
  }

  public getSampleById(id: string) {
    return this.samples.find((s) => s.id === id);
  }

  public getSampleByBarcode(barcode: string) {
    const clean = barcode.trim().toUpperCase();
    return this.samples.find(
      (s) => s.barcode.toUpperCase() === clean || s.batchNumber.toUpperCase() === clean || s.id.toUpperCase() === clean
    );
  }

  public addSample(sample: HoneySampleRecord) {
    this.samples.unshift(sample);
    // Deduct scan from shop quota if shopId matches
    if (sample.shopId) {
      const shop = this.shops.find((s) => s.id === sample.shopId);
      if (shop) {
        if (shop.scansRemaining > 0) shop.scansRemaining -= 1;
        shop.totalScansPerformed += 1;
      }
    }
    this.save();
    return sample;
  }

  public addProduct(product: HoneyProduct) {
    this.products.unshift(product);
    this.save();
    return product;
  }

  public updateProductStock(id: string, newStock: number) {
    const prod = this.products.find((p) => p.id === id);
    if (prod) {
      prod.stockQuantity = newStock;
      this.save();
    }
    return prod;
  }

  public toggleShopVisibility(shopId: string, isVisible: boolean) {
    const shop = this.shops.find((s) => s.id === shopId);
    if (shop) {
      shop.isVisibleInSearch = isVisible;
      this.save();
    }
    return shop;
  }

  public renewShopSubscription(shopId: string, planKey: 'STARTER' | 'COMMERCIAL' | 'ENTERPRISE') {
    const shop = this.shops.find((s) => s.id === shopId);
    const plan = this.plans.find((p) => p.planKey === planKey);
    if (shop && plan) {
      shop.subscriptionPlan = planKey;
      shop.subscriptionStatus = 'ACTIVE';
      shop.scansRemaining += plan.scanQuota;
      this.save();
    }
    return shop;
  }

  public createOrder(order: Order) {
    this.orders.unshift(order);
    // reduce stocks
    for (const item of order.items) {
      const prod = this.products.find((p) => p.id === item.productId);
      if (prod && prod.stockQuantity >= item.quantity) {
        prod.stockQuantity -= item.quantity;
      }
    }
    this.save();
    return order;
  }
}

export const dbStore = new DatabaseStore();
