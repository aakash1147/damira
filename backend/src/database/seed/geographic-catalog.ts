/**
 * Comprehensive Indian Geographical Catalog
 * Covering all 28 Indian States and 8 Union Territories with verified city & pincode relationships.
 */

export interface CityCatalogItem {
  name: string;
  pincodes: string[];
  district: string;
  weight: number; // Relative weight within state
}

export interface StateCatalogItem {
  code: string;
  name: string;
  gstCode: string;
  weight: number; // Relative weight across India
  cities: CityCatalogItem[];
}

export const INDIA_GEOGRAPHIC_CATALOG: StateCatalogItem[] = [
  // --- NORTH REGION ---
  {
    code: 'DL',
    name: 'Delhi',
    gstCode: '07',
    weight: 140, // High commercial & e-commerce volume
    cities: [
      { name: 'New Delhi', pincodes: ['110001', '110003', '110017', '110024', '110016', '110021'], district: 'New Delhi', weight: 45 },
      { name: 'South Delhi', pincodes: ['110019', '110048', '110049', '110065', '110070'], district: 'South Delhi', weight: 25 },
      { name: 'West Delhi', pincodes: ['110015', '110018', '110026', '110058'], district: 'West Delhi', weight: 15 },
      { name: 'North Delhi', pincodes: ['110007', '110009', '110054'], district: 'North Delhi', weight: 10 },
      { name: 'East Delhi', pincodes: ['110091', '110092', '110095'], district: 'East Delhi', weight: 5 },
    ],
  },
  {
    code: 'HR',
    name: 'Haryana',
    gstCode: '06',
    weight: 70,
    cities: [
      { name: 'Gurugram', pincodes: ['122001', '122002', '122018', '122051', '122102'], district: 'Gurugram', weight: 50 },
      { name: 'Faridabad', pincodes: ['121001', '121002', '121006', '121007'], district: 'Faridabad', weight: 25 },
      { name: 'Panipat', pincodes: ['132103', '132104'], district: 'Panipat', weight: 12 },
      { name: 'Karnal', pincodes: ['132001', '132002'], district: 'Karnal', weight: 8 },
      { name: 'Ambala', pincodes: ['133001', '134003'], district: 'Ambala', weight: 5 },
    ],
  },
  {
    code: 'UP',
    name: 'Uttar Pradesh',
    gstCode: '09',
    weight: 110,
    cities: [
      { name: 'Noida', pincodes: ['201301', '201304', '201307', '201310'], district: 'Gautam Buddha Nagar', weight: 30 },
      { name: 'Ghaziabad', pincodes: ['201001', '201010', '201012'], district: 'Ghaziabad', weight: 20 },
      { name: 'Lucknow', pincodes: ['226001', '226010', '226016', '226024'], district: 'Lucknow', weight: 20 },
      { name: 'Kanpur', pincodes: ['208001', '208005', '208012'], district: 'Kanpur Nagar', weight: 12 },
      { name: 'Agra', pincodes: ['282001', '282002', '282005'], district: 'Agra', weight: 8 },
      { name: 'Varanasi', pincodes: ['221001', '221002', '221005'], district: 'Varanasi', weight: 5 },
      { name: 'Prayagraj', pincodes: ['211001', '211002'], district: 'Prayagraj', weight: 3 },
      { name: 'Meerut', pincodes: ['250001', '250002'], district: 'Meerut', weight: 2 },
    ],
  },
  {
    code: 'PB',
    name: 'Punjab',
    gstCode: '03',
    weight: 40,
    cities: [
      { name: 'Ludhiana', pincodes: ['141001', '141003', '141008'], district: 'Ludhiana', weight: 45 },
      { name: 'Amritsar', pincodes: ['143001', '143005'], district: 'Amritsar', weight: 30 },
      { name: 'Jalandhar', pincodes: ['144001', '144008'], district: 'Jalandhar', weight: 15 },
      { name: 'Patiala', pincodes: ['147001'], district: 'Patiala', weight: 10 },
    ],
  },
  {
    code: 'RJ',
    name: 'Rajasthan',
    gstCode: '08',
    weight: 45,
    cities: [
      { name: 'Jaipur', pincodes: ['302001', '302004', '302015', '302020'], district: 'Jaipur', weight: 55 },
      { name: 'Jodhpur', pincodes: ['342001', '342003'], district: 'Jodhpur', weight: 20 },
      { name: 'Udaipur', pincodes: ['313001', '313002'], district: 'Udaipur', weight: 15 },
      { name: 'Kota', pincodes: ['324005', '324007'], district: 'Kota', weight: 10 },
    ],
  },
  {
    code: 'UK',
    name: 'Uttarakhand',
    gstCode: '05',
    weight: 20,
    cities: [
      { name: 'Dehradun', pincodes: ['248001', '248006', '248008'], district: 'Dehradun', weight: 50 },
      { name: 'Haridwar', pincodes: ['249401', '249407'], district: 'Haridwar', weight: 25 },
      { name: 'Haldwani', pincodes: ['263139'], district: 'Nainital', weight: 15 },
      { name: 'Rishikesh', pincodes: ['249201'], district: 'Dehradun', weight: 10 },
    ],
  },
  {
    code: 'HP',
    name: 'Himachal Pradesh',
    gstCode: '02',
    weight: 15,
    cities: [
      { name: 'Shimla', pincodes: ['171001', '171002'], district: 'Shimla', weight: 50 },
      { name: 'Dharamshala', pincodes: ['176215'], district: 'Kangra', weight: 30 },
      { name: 'Solan', pincodes: ['173212'], district: 'Solan', weight: 20 },
    ],
  },
  {
    code: 'JK',
    name: 'Jammu and Kashmir',
    gstCode: '01',
    weight: 20,
    cities: [
      { name: 'Srinagar', pincodes: ['190001', '190004', '190008'], district: 'Srinagar', weight: 55 },
      { name: 'Jammu', pincodes: ['180001', '180004'], district: 'Jammu', weight: 35 },
      { name: 'Anantnag', pincodes: ['192101'], district: 'Anantnag', weight: 10 },
    ],
  },
  {
    code: 'LA',
    name: 'Ladakh',
    gstCode: '38',
    weight: 6,
    cities: [
      { name: 'Leh', pincodes: ['194101'], district: 'Leh', weight: 70 },
      { name: 'Kargil', pincodes: ['194103'], district: 'Kargil', weight: 30 },
    ],
  },
  {
    code: 'CH',
    name: 'Chandigarh',
    gstCode: '04',
    weight: 18,
    cities: [
      { name: 'Chandigarh', pincodes: ['160017', '160022', '160036', '160047'], district: 'Chandigarh', weight: 100 },
    ],
  },

  // --- WEST REGION ---
  {
    code: 'MH',
    name: 'Maharashtra',
    gstCode: '27',
    weight: 180, // Highest revenue & volume hub
    cities: [
      { name: 'Mumbai', pincodes: ['400001', '400050', '400053', '400076', '400092', '400071'], district: 'Mumbai Suburban', weight: 50 },
      { name: 'Pune', pincodes: ['411001', '411004', '411014', '411038', '411057'], district: 'Pune', weight: 25 },
      { name: 'Thane', pincodes: ['400601', '400607', '400615'], district: 'Thane', weight: 10 },
      { name: 'Nagpur', pincodes: ['440001', '440010', '440022'], district: 'Nagpur', weight: 8 },
      { name: 'Nashik', pincodes: ['422001', '422005'], district: 'Nashik', weight: 7 },
    ],
  },
  {
    code: 'GJ',
    name: 'Gujarat',
    gstCode: '24',
    weight: 85,
    cities: [
      { name: 'Ahmedabad', pincodes: ['380001', '380009', '380015', '380054'], district: 'Ahmedabad', weight: 50 },
      { name: 'Surat', pincodes: ['395001', '395003', '395007'], district: 'Surat', weight: 25 },
      { name: 'Vadodara', pincodes: ['390001', '390007', '390020'], district: 'Vadodara', weight: 15 },
      { name: 'Rajkot', pincodes: ['360001', '360005'], district: 'Rajkot', weight: 10 },
    ],
  },
  {
    code: 'GA',
    name: 'Goa',
    gstCode: '30',
    weight: 12,
    cities: [
      { name: 'Panaji', pincodes: ['403001'], district: 'North Goa', weight: 50 },
      { name: 'Margao', pincodes: ['403601'], district: 'South Goa', weight: 35 },
      { name: 'Vasco da Gama', pincodes: ['403802'], district: 'South Goa', weight: 15 },
    ],
  },
  {
    code: 'DN',
    name: 'Dadra and Nagar Haveli and Daman and Diu',
    gstCode: '26',
    weight: 7,
    cities: [
      { name: 'Daman', pincodes: ['396210'], district: 'Daman', weight: 50 },
      { name: 'Silvassa', pincodes: ['396230'], district: 'Dadra and Nagar Haveli', weight: 35 },
      { name: 'Diu', pincodes: ['362520'], district: 'Diu', weight: 15 },
    ],
  },

  // --- SOUTH REGION ---
  {
    code: 'KA',
    name: 'Karnataka',
    gstCode: '29',
    weight: 130, // Tech corridor & affluent buyers
    cities: [
      { name: 'Bengaluru', pincodes: ['560001', '560025', '560034', '560038', '560078', '560102'], district: 'Bengaluru Urban', weight: 75 },
      { name: 'Mysuru', pincodes: ['570001', '570008'], district: 'Mysuru', weight: 12 },
      { name: 'Mangaluru', pincodes: ['575001', '575003'], district: 'Dakshina Kannada', weight: 8 },
      { name: 'Hubballi', pincodes: ['580020'], district: 'Dharwad', weight: 5 },
    ],
  },
  {
    code: 'TS',
    name: 'Telangana',
    gstCode: '36',
    weight: 90,
    cities: [
      { name: 'Hyderabad', pincodes: ['500001', '500034', '500081', '500084', '500032'], district: 'Hyderabad', weight: 85 },
      { name: 'Warangal', pincodes: ['506001', '506002'], district: 'Warangal', weight: 10 },
      { name: 'Nizamabad', pincodes: ['503001'], district: 'Nizamabad', weight: 5 },
    ],
  },
  {
    code: 'TN',
    name: 'Tamil Nadu',
    gstCode: '33',
    weight: 85,
    cities: [
      { name: 'Chennai', pincodes: ['600001', '600028', '600034', '600096', '600113'], district: 'Chennai', weight: 60 },
      { name: 'Coimbatore', pincodes: ['641001', '641002', '641018'], district: 'Coimbatore', weight: 25 },
      { name: 'Madurai', pincodes: ['625001', '625020'], district: 'Madurai', weight: 10 },
      { name: 'Salem', pincodes: ['636001'], district: 'Salem', weight: 5 },
    ],
  },
  {
    code: 'KL',
    name: 'Kerala',
    gstCode: '32',
    weight: 45,
    cities: [
      { name: 'Kochi', pincodes: ['682001', '682011', '682024'], district: 'Ernakulam', weight: 50 },
      { name: 'Thiruvananthapuram', pincodes: ['695001', '695004'], district: 'Thiruvananthapuram', weight: 30 },
      { name: 'Kozhikode', pincodes: ['673001', '673004'], district: 'Kozhikode', weight: 20 },
    ],
  },
  {
    code: 'AP',
    name: 'Andhra Pradesh',
    gstCode: '37',
    weight: 40,
    cities: [
      { name: 'Visakhapatnam', pincodes: ['530001', '530017'], district: 'Visakhapatnam', weight: 45 },
      { name: 'Vijayawada', pincodes: ['520001', '520010'], district: 'NTR', weight: 30 },
      { name: 'Guntur', pincodes: ['522002'], district: 'Guntur', weight: 15 },
      { name: 'Tirupati', pincodes: ['517501'], district: 'Tirupati', weight: 10 },
    ],
  },
  {
    code: 'PY',
    name: 'Puducherry',
    gstCode: '34',
    weight: 8,
    cities: [
      { name: 'Puducherry', pincodes: ['605001', '605004'], district: 'Puducherry', weight: 70 },
      { name: 'Karaikal', pincodes: ['609602'], district: 'Karaikal', weight: 30 },
    ],
  },

  // --- EAST REGION ---
  {
    code: 'WB',
    name: 'West Bengal',
    gstCode: '19',
    weight: 55,
    cities: [
      { name: 'Kolkata', pincodes: ['700001', '700016', '700064', '700091'], district: 'Kolkata', weight: 65 },
      { name: 'Howrah', pincodes: ['711101', '711106'], district: 'Howrah', weight: 15 },
      { name: 'Siliguri', pincodes: ['734001', '734005'], district: 'Darjeeling', weight: 12 },
      { name: 'Durgapur', pincodes: ['713216'], district: 'Paschim Bardhaman', weight: 8 },
    ],
  },
  {
    code: 'BR',
    name: 'Bihar',
    gstCode: '10',
    weight: 35,
    cities: [
      { name: 'Patna', pincodes: ['800001', '800014', '800020'], district: 'Patna', weight: 60 },
      { name: 'Gaya', pincodes: ['823001'], district: 'Gaya', weight: 20 },
      { name: 'Muzaffarpur', pincodes: ['842001'], district: 'Muzaffarpur', weight: 20 },
    ],
  },
  {
    code: 'OR',
    name: 'Odisha',
    gstCode: '21',
    weight: 30,
    cities: [
      { name: 'Bhubaneswar', pincodes: ['751001', '751010', '751024'], district: 'Khurda', weight: 55 },
      { name: 'Cuttack', pincodes: ['753001', '753003'], district: 'Cuttack', weight: 25 },
      { name: 'Rourkela', pincodes: ['769001'], district: 'Sundargarh', weight: 20 },
    ],
  },
  {
    code: 'JH',
    name: 'Jharkhand',
    gstCode: '20',
    weight: 25,
    cities: [
      { name: 'Ranchi', pincodes: ['834001', '834002'], district: 'Ranchi', weight: 50 },
      { name: 'Jamshedpur', pincodes: ['831001', '831005'], district: 'East Singhbhum', weight: 35 },
      { name: 'Dhanbad', pincodes: ['826001'], district: 'Dhanbad', weight: 15 },
    ],
  },

  // --- CENTRAL REGION ---
  {
    code: 'MP',
    name: 'Madhya Pradesh',
    gstCode: '23',
    weight: 45,
    cities: [
      { name: 'Indore', pincodes: ['452001', '452010', '452016'], district: 'Indore', weight: 50 },
      { name: 'Bhopal', pincodes: ['462001', '462016', '462023'], district: 'Bhopal', weight: 30 },
      { name: 'Jabalpur', pincodes: ['482001'], district: 'Jabalpur', weight: 12 },
      { name: 'Gwalior', pincodes: ['474001'], district: 'Gwalior', weight: 8 },
    ],
  },
  {
    code: 'CG',
    name: 'Chhattisgarh',
    gstCode: '22',
    weight: 22,
    cities: [
      { name: 'Raipur', pincodes: ['492001', '492006'], district: 'Raipur', weight: 55 },
      { name: 'Bilaspur', pincodes: ['495001'], district: 'Bilaspur', weight: 25 },
      { name: 'Bhilai', pincodes: ['490006'], district: 'Durg', weight: 20 },
    ],
  },

  // --- NORTH-EAST REGION ---
  {
    code: 'AS',
    name: 'Assam',
    gstCode: '18',
    weight: 22,
    cities: [
      { name: 'Guwahati', pincodes: ['781001', '781005', '781022'], district: 'Kamrup Metropolitan', weight: 65 },
      { name: 'Silchar', pincodes: ['788001'], district: 'Cachar', weight: 20 },
      { name: 'Dibrugarh', pincodes: ['786001'], district: 'Dibrugarh', weight: 15 },
    ],
  },
  {
    code: 'SK',
    name: 'Sikkim',
    gstCode: '11',
    weight: 7,
    cities: [
      { name: 'Gangtok', pincodes: ['737101', '737102'], district: 'East Sikkim', weight: 80 },
      { name: 'Namchi', pincodes: ['737126'], district: 'South Sikkim', weight: 20 },
    ],
  },
  {
    code: 'TR',
    name: 'Tripura',
    gstCode: '16',
    weight: 6,
    cities: [
      { name: 'Agartala', pincodes: ['799001', '799006'], district: 'West Tripura', weight: 85 },
      { name: 'Dharmanagar', pincodes: ['799250'], district: 'North Tripura', weight: 15 },
    ],
  },
  {
    code: 'ML',
    name: 'Meghalaya',
    gstCode: '17',
    weight: 6,
    cities: [
      { name: 'Shillong', pincodes: ['793001', '793003'], district: 'East Khasi Hills', weight: 85 },
      { name: 'Tura', pincodes: ['794001'], district: 'West Garo Hills', weight: 15 },
    ],
  },
  {
    code: 'MN',
    name: 'Manipur',
    gstCode: '14',
    weight: 5,
    cities: [
      { name: 'Imphal', pincodes: ['795001', '795004'], district: 'Imphal West', weight: 85 },
      { name: 'Churachandpur', pincodes: ['795128'], district: 'Churachandpur', weight: 15 },
    ],
  },
  {
    code: 'NL',
    name: 'Nagaland',
    gstCode: '13',
    weight: 5,
    cities: [
      { name: 'Kohima', pincodes: ['797001'], district: 'Kohima', weight: 50 },
      { name: 'Dimapur', pincodes: ['797112'], district: 'Dimapur', weight: 50 },
    ],
  },
  {
    code: 'MZ',
    name: 'Mizoram',
    gstCode: '15',
    weight: 5,
    cities: [
      { name: 'Aizawl', pincodes: ['796001', '796007'], district: 'Aizawl', weight: 85 },
      { name: 'Lunglei', pincodes: ['796701'], district: 'Lunglei', weight: 15 },
    ],
  },
  {
    code: 'AR',
    name: 'Arunachal Pradesh',
    gstCode: '12',
    weight: 5,
    cities: [
      { name: 'Itanagar', pincodes: ['791111'], district: 'Papum Pare', weight: 70 },
      { name: 'Naharlagun', pincodes: ['791110'], district: 'Papum Pare', weight: 30 },
    ],
  },

  // --- ISLANDS ---
  {
    code: 'AN',
    name: 'Andaman and Nicobar Islands',
    gstCode: '35',
    weight: 5,
    cities: [
      { name: 'Port Blair', pincodes: ['744101', '744103'], district: 'South Andaman', weight: 85 },
      { name: 'Havelock', pincodes: ['744211'], district: 'South Andaman', weight: 15 },
    ],
  },
  {
    code: 'LD',
    name: 'Lakshadweep',
    gstCode: '31',
    weight: 4,
    cities: [
      { name: 'Kavaratti', pincodes: ['682555'], district: 'Lakshadweep', weight: 70 },
      { name: 'Agatti', pincodes: ['682553'], district: 'Lakshadweep', weight: 30 },
    ],
  },
];
