/**
 * AutoMotive Buddy - Enhanced DTC Database
 */

export const vehicleDatabase = {
  manufacturers: [
    {
      id: 'ford',
      name: 'Ford',
      logo: '🚗',
      color: '#003478',
      models: [
        {
          id: 'f150',
          name: 'F-150',
          years: [2020, 2021, 2022, 2023, 2024],
          engines: ['EcoBoost 3.5L', 'EcoBoost 2.7L', '5.0L V8', 'PowerStroke 6.7L Diesel'],
          dtcPrefix: 'F150'
        },
        {
          id: 'ranger_raptor',
          name: 'Ranger Raptor',
          years: [2021, 2022, 2023, 2024],
          engines: ['EcoBoost 2.0L', 'EcoBoost 3.2L Diesel'],
          dtcPrefix: 'RNG'
        },
        {
          id: 'everest',
          name: 'Everest',
          years: [2018, 2019, 2020, 2021, 2022, 2023, 2024],
          engines: ['EcoBoost 3.2L', 'Diesel 3.2L', 'Diesel 2.0L'],
          dtcPrefix: 'EVR'
        },
        {
          id: 'mustang',
          name: 'Mustang',
          years: [2019, 2020, 2021, 2022, 2023, 2024],
          engines: ['EcoBoost 2.3L', '5.0L V8', 'Dark Horse EcoBoost'],
          dtcPrefix: 'MST'
        },
        {
          id: 'escape',
          name: 'Escape',
          years: [2019, 2020, 2021, 2022, 2023, 2024],
          engines: ['EcoBoost 1.5L', 'EcoBoost 2.0L', 'Hybrid'],
          dtcPrefix: 'ESC'
        },
        {
          id: 'explorer',
          name: 'Explorer',
          years: [2020, 2021, 2022, 2023, 2024],
          engines: ['EcoBoost 3.0L', 'EcoBoost 2.3L'],
          dtcPrefix: 'EXP'
        },
        {
          id: 'edge',
          name: 'Edge',
          years: [2019, 2020, 2021, 2022, 2023],
          engines: ['EcoBoost 2.0L', 'EcoBoost 3.0L'],
          dtcPrefix: 'EDG'
        }
      ]
    },
    {
      id: 'toyota',
      name: 'Toyota',
      logo: '🚙',
      color: '#eb0a1e',
      models: [
        {
          id: 'hilux',
          name: 'Hilux',
          years: [2018, 2019, 2020, 2021, 2022, 2023, 2024],
          engines: ['Diesel 2.8L', 'Diesel 2.4L', 'Gasoline 2.7L'],
          dtcPrefix: 'HLX'
        },
        {
          id: 'fortuner',
          name: 'Fortuner',
          years: [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023],
          engines: ['Diesel 2.8L', 'Gasoline 2.7L'],
          dtcPrefix: 'FOR'
        }
      ]
    },
    {
      id: 'mitsubishi',
      name: 'Mitsubishi',
      logo: '🔶',
      color: '#d41e3b',
      models: [
        {
          id: 'pajero',
          name: 'Pajero',
          years: [2014, 2015, 2016, 2017, 2018, 2019, 2020],
          engines: ['Diesel 3.2L', 'Gasoline 3.8L'],
          dtcPrefix: 'PJR'
        },
        {
          id: 'strada',
          name: 'Strada',
          years: [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024],
          engines: ['Diesel 2.4L', 'Gasoline 2.4L'],
          dtcPrefix: 'STR'
        },
        {
          id: 'montero',
          name: 'Montero Sport',
          years: [2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024],
          engines: ['Diesel 2.4L MIVEC'],
          dtcPrefix: 'MON'
        }
      ]
    },
    {
      id: 'honda',
      name: 'Honda',
      logo: 'H',
      color: '#E4002B',
      models: [
        {
          id: 'civic',
          name: 'Civic',
          years: [2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024],
          engines: ['1.8L i-VTEC', '1.5L Turbo', '2.0L i-VTEC'],
          dtcPrefix: 'CIV'
        },
        {
          id: 'crv',
          name: 'CR-V',
          years: [2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024],
          engines: ['1.6L i-DTEC', '2.0L i-VTEC', '1.5L Turbo'],
          dtcPrefix: 'CRV'
        },
        {
          id: 'city',
          name: 'City',
          years: [2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024],
          engines: ['1.5L i-VTEC'],
          dtcPrefix: 'CTY'
        }
      ]
    },
    {
      id: 'nissan',
      name: 'Nissan',
      logo: 'N',
      color: '#C11030',
      models: [
        {
          id: 'navara',
          name: 'Navara',
          years: [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024],
          engines: ['2.5L YD25 Diesel'],
          dtcPrefix: 'NAV'
        },
        {
          id: 'terra',
          name: 'Terra',
          years: [2018, 2019, 2020, 2021, 2022, 2023, 2024],
          engines: ['2.5L YD25 Diesel'],
          dtcPrefix: 'TRA'
        },
        {
          id: 'patrol',
          name: 'Patrol Safary',
          years: [2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024],
          engines: ['5.6L V8', '3.0L Diesel'],
          dtcPrefix: 'PTR'
        }
      ]
    },
    {
      id: 'isuzu',
      name: 'Isuzu',
      logo: 'I',
      color: '#FF0000',
      models: [
        {
          id: 'dmax',
          name: 'D-MAX',
          years: [2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024],
          engines: ['3.0L 4JJ3 Blue Power', '1.9L RZ4E Blue Power'],
          dtcPrefix: 'DMX'
        },
        {
          id: 'mux',
          name: 'mu-X',
          years: [2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024],
          engines: ['3.0L 4JJ3 Blue Power', '1.9L RZ4E Blue Power'],
          dtcPrefix: 'MUX'
        }
      ]
    },
    {
      id: 'hyundai',
      name: 'Hyundai',
      logo: 'H',
      color: '#002C5F',
      models: [
        {
          id: 'accent',
          name: 'Accent',
          years: [2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020],
          engines: ['1.6L CRDi Diesel', '1.4L Kappa Gasoline'],
          dtcPrefix: 'ACC'
        },
        {
          id: 'tucson',
          name: 'Tucson',
          years: [2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024],
          engines: ['2.0L CRDi Diesel', '2.0L Nu Gasoline'],
          dtcPrefix: 'TUC'
        }
      ]
    },
    {
      id: 'suzuki',
      name: 'Suzuki',
      logo: 'S',
      color: '#E30613',
      models: [
        {
          id: 'ertiga',
          name: 'Ertiga',
          years: [2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024],
          engines: ['1.5L K15B', '1.4L K14B'],
          dtcPrefix: 'ERT'
        },
        {
          id: 'jimny',
          name: 'Jimny',
          years: [2018, 2019, 2020, 2021, 2022, 2023, 2024],
          engines: ['1.5L K15B'],
          dtcPrefix: 'JMN'
        }
      ]
    },
    {
      id: 'bmw',
      name: 'BMW',
      logo: 'B',
      color: '#0066B3',
      models: [
        {
          id: '3series',
          name: '3 Series',
          years: [2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024],
          engines: ['2.0L Turbo Diesel', '2.0L Turbo Gasoline', '3.0L Inline-6'],
          dtcPrefix: 'BMW3'
        },
        {
          id: '5series',
          name: '5 Series',
          years: [2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024],
          engines: ['2.0L Turbo Diesel', '3.0L Inline-6'],
          dtcPrefix: 'BMW5'
        },
        {
          id: 'x5',
          name: 'X5',
          years: [2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024],
          engines: ['3.0L Inline-6 Diesel', '3.0L Inline-6 Gasoline'],
          dtcPrefix: 'BMWX5'
        }
      ]
    },
    {
      id: 'mercedes',
      name: 'Mercedes-Benz',
      logo: 'M',
      color: '#000000',
      models: [
        {
          id: 'cclass',
          name: 'C-Class',
          years: [2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024],
          engines: ['1.5L Turbo', '2.0L Turbo', '2.1L Diesel'],
          dtcPrefix: 'MBC'
        },
        {
          id: 'eclass',
          name: 'E-Class',
          years: [2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024],
          engines: ['2.0L Turbo', '2.0L Diesel'],
          dtcPrefix: 'MBE'
        }
      ]
    },
    {
      id: 'tesla',
      name: 'Tesla',
      logo: '⚡',
      color: '#E31937',
      models: [
        { id: 'modely', name: 'Model Y', years: [2020, 2021, 2022, 2023, 2024], engines: ['Dual Motor AWD', 'Single Motor RWD'], dtcPrefix: 'TSL' },
        { id: 'model3', name: 'Model 3', years: [2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024], engines: ['Dual Motor AWD', 'Long Range', 'Standard Plus'], dtcPrefix: 'TSL' }
      ]
    },
    {
      id: 'byd',
      name: 'BYD',
      logo: '🔋',
      color: '#0055A4',
      models: [
        { id: 'atto3', name: 'Atto 3 / Yuan Plus', years: [2022, 2023, 2024], engines: ['Electric 150kW'], dtcPrefix: 'BYD' },
        { id: 'seal', name: 'Seal', years: [2023, 2024], engines: ['Long Range AWD', 'Design RWD'], dtcPrefix: 'BYD' },
        { id: 'dolphin', name: 'Dolphin', years: [2023, 2024], engines: ['Electric 70kW', 'Electric 150kW'], dtcPrefix: 'BYD' }
      ]
    },
    {
      id: 'komatsu',
      name: 'Komatsu',
      logo: '🏗️',
      color: '#FFD700',
      models: [
        {
          id: 'pc200',
          name: 'PC200-8 Excavator',
          years: [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024],
          engines: ['SAA6D107E-1'],
          dtcPrefix: 'KOM'
        },
        {
          id: 'd65',
          name: 'D65P-17 Dozer',
          years: [2016, 2017, 2018, 2019, 2020, 2021, 2022],
          engines: ['SAA6D114E-5'],
          dtcPrefix: 'KOM'
        },
        {
          id: 'wa470',
          name: 'WA470-6 Wheel Loader',
          years: [2018, 2019, 2020, 2021, 2022, 2023],
          engines: ['SAA6D125E-5'],
          dtcPrefix: 'KOM'
        }
      ]
    },
    {
      id: 'caterpillar',
      name: 'Caterpillar',
      logo: '🚜',
      color: '#FFCD11',
      models: [
        {
          id: '320gc',
          name: '320 GC Excavator',
          years: [2018, 2019, 2020, 2021, 2022, 2023, 2024],
          engines: ['Cat C4.4 ACERT'],
          dtcPrefix: 'CAT'
        },
        {
          id: 'd6k2',
          name: 'D6K2 Dozer',
          years: [2017, 2018, 2019, 2020, 2021],
          engines: ['Cat C4.4 ACERT'],
          dtcPrefix: 'CAT'
        }
      ]
    },
    {
      id: 'jcb',
      name: 'JCB',
      logo: '🏗️',
      color: '#FFB800',
      models: [
        {
          id: '3cx',
          name: '3CX Backhoe Loader',
          years: [2016, 2017, 2018, 2019, 2020, 2021, 2022],
          engines: ['JCB EcoMAX'],
          dtcPrefix: 'JCB'
        }
      ]
    },
    {
      id: 'volvoce',
      name: 'Volvo CE',
      logo: '🚜',
      color: '#FFD100',
      models: [
        {
          id: 'ec210',
          name: 'EC210B Excavator',
          years: [2015, 2016, 2017, 2018, 2019, 2020],
          engines: ['Volvo D6E'],
          dtcPrefix: 'VOL'
        }
      ]
    },
    {
      id: 'hitachi',
      name: 'Hitachi',
      logo: '🏗️',
      color: '#FF6600',
      models: [
        { id: 'zx200', name: 'ZX200-5G Excavator', years: [2015, 2016, 2017, 2018, 2019], engines: ['Isuzu CC-6BG1T'], dtcPrefix: 'HIT' },
        { id: 'zx330', name: 'ZX330-5G Excavator', years: [2015, 2016, 2017, 2018, 2019, 2020], engines: ['Isuzu AH-6HK1X'], dtcPrefix: 'HIT' }
      ]
    },
    {
      id: 'johndeere',
      name: 'John Deere',
      logo: '🚜',
      color: '#367C2B',
      models: [
        { id: '310L', name: '310L Backhoe', years: [2018, 2019, 2020, 2021, 2022], engines: ['John Deere PowerTech EWL 4.5L'], dtcPrefix: 'JD' },
        { id: '210G', name: '210G LC Excavator', years: [2019, 2020, 2021, 2022, 2023], engines: ['John Deere PowerTech PSS 6.8L'], dtcPrefix: 'JD' },
        { id: '644p', name: '644 P-Tier Wheel Loader', years: [2022, 2023, 2024], engines: ['John Deere PowerTech PSS 6.8L'], dtcPrefix: 'JD' }
      ]
    },
    {
      id: 'liebherr',
      name: 'Liebherr',
      logo: '🏗️',
      color: '#FFCC00',
      models: [
        { id: 'r920', name: 'R 920 Compact', years: [2017, 2018, 2019, 2020, 2021], engines: ['Liebherr D924'], dtcPrefix: 'LIE' },
        { id: 'l566', name: 'L 566 XPower', years: [2018, 2019, 2020, 2021, 2022], engines: ['Liebherr D936 A7'], dtcPrefix: 'LIE' }
      ]
    },
    {
      id: 'bobcat',
      name: 'Bobcat',
      logo: '🚜',
      color: '#FF0000',
      models: [
        { id: 't76', name: 'T76 Compact Track Loader', years: [2020, 2021, 2022, 2023, 2024], engines: ['Bobcat 2.4L'], dtcPrefix: 'BOB' },
        { id: 's66', name: 'S66 Skid-Steer Loader', years: [2020, 2021, 2022, 2023, 2024], engines: ['Bobcat 2.4L'], dtcPrefix: 'BOB' }
      ]
    },
    {
      id: 'casece',
      name: 'Case CE',
      logo: '🏗️',
      color: '#B22222',
      models: [
        { id: '580n', name: '580N Backhoe Loader', years: [2016, 2017, 2018, 2019, 2020, 2021], engines: ['FPT 3.4L'], dtcPrefix: 'CAS' },
        { id: 'cx210c', name: 'CX210C Excavator', years: [2014, 2015, 2016, 2017, 2018], engines: ['Isuzu AM-4HK1X'], dtcPrefix: 'CAS' }
      ]
    },
    {
      id: 'kobelco',
      name: 'Kobelco',
      logo: '🏗️',
      color: '#00A3E0',
      models: [
        { id: 'sk200', name: 'SK200-10 Excavator', years: [2017, 2018, 2019, 2020, 2021, 2022], engines: ['Hino J05E-UM'], dtcPrefix: 'KOB' },
        { id: 'sk130', name: 'SK130-11 Excavator', years: [2019, 2020, 2021, 2022, 2023, 2024], engines: ['Isuzu 4JJ1X'], dtcPrefix: 'KOB' }
      ]
    },
    {
      id: 'doosan',
      name: 'Doosan / Develon',
      logo: '🏗️',
      color: '#FF4500',
      models: [
        { id: 'dx225lc', name: 'DX225LC-5 Excavator', years: [2016, 2017, 2018, 2019, 2020, 2021], engines: ['Doosan DL06P'], dtcPrefix: 'DOO' },
        { id: 'dl250', name: 'DL250-5 Wheel Loader', years: [2015, 2016, 2017, 2018, 2019, 2020], engines: ['Doosan DL06P'], dtcPrefix: 'DOO' }
      ]
    },
    {
      id: 'sany',
      name: 'SANY',
      logo: '🏗️',
      color: '#E3000F',
      models: [
        { id: 'sy215c', name: 'SY215C Excavator', years: [2018, 2019, 2020, 2021, 2022, 2023, 2024], engines: ['Cummins QSB6.7'], dtcPrefix: 'SAN' },
        { id: 'sy365h', name: 'SY365H Excavator', years: [2019, 2020, 2021, 2022, 2023, 2024], engines: ['Isuzu 6HK1'], dtcPrefix: 'SAN' }
      ]
    },
    {
      id: 'chevrolet',
      name: 'Chevrolet',
      logo: '🏎️',
      color: '#CC9933',
      models: [
        { id: 'silverado', name: 'Silverado 1500', years: [2019, 2020, 2021, 2022, 2023, 2024], engines: ['5.3L V8', '6.2L V8', '3.0L Duramax'], dtcPrefix: 'CHV' },
        { id: 'colorado', name: 'Colorado', years: [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023], engines: ['2.8L Duramax', '3.6L V6'], dtcPrefix: 'CHV' },
        { id: 'tahoe', name: 'Tahoe', years: [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023], engines: ['5.3L V8'], dtcPrefix: 'CHV' }
      ]
    },
    {
      id: 'volkswagen',
      name: 'Volkswagen',
      logo: 'V',
      color: '#154194',
      models: [
        { id: 'golf', name: 'Golf', years: [2015, 2016, 2017, 2018, 2019, 2020, 2021], engines: ['1.8L TSI', '2.0L TSI'], dtcPrefix: 'VW' },
        { id: 'jetta', name: 'Jetta', years: [2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021], engines: ['1.4L TSI', '1.8L TSI'], dtcPrefix: 'VW' },
        { id: 'tiguan', name: 'Tiguan', years: [2018, 2019, 2020, 2021, 2022, 2023], engines: ['2.0L TSI'], dtcPrefix: 'VW' }
      ]
    },
    {
      id: 'audi',
      name: 'Audi',
      logo: 'A',
      color: '#000000',
      models: [
        { id: 'a4', name: 'A4', years: [2017, 2018, 2019, 2020, 2021, 2022], engines: ['2.0T'], dtcPrefix: 'AUD' },
        { id: 'q5', name: 'Q5', years: [2018, 2019, 2020, 2021, 2022, 2023], engines: ['2.0T'], dtcPrefix: 'AUD' }
      ]
    },
    {
      id: 'porsche',
      name: 'Porsche',
      logo: 'P',
      color: '#8A0F14',
      models: [
        { id: '911', name: '911 (992)', years: [2020, 2021, 2022, 2023, 2024], engines: ['3.0L Twin-Turbo Flat-6'], dtcPrefix: 'POR' },
        { id: 'macan', name: 'Macan', years: [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022], engines: ['2.0L Turbo', '3.0L V6 Turbo'], dtcPrefix: 'POR' }
      ]
    },
    {
      id: 'kia',
      name: 'Kia',
      logo: 'K',
      color: '#BB162B',
      models: [
        { id: 'sportage', name: 'Sportage', years: [2016, 2017, 2018, 2019, 2020, 2021, 2022], engines: ['2.0L CRDi', '2.4L GDI'], dtcPrefix: 'KIA' },
        { id: 'sorento', name: 'Sorento', years: [2015, 2016, 2017, 2018, 2019, 2020], engines: ['2.2L CRDi', '3.3L V6'], dtcPrefix: 'KIA' }
      ]
    },
    {
      id: 'mazda',
      name: 'Mazda',
      logo: 'M',
      color: '#8A0210',
      models: [
        { id: 'cx5', name: 'CX-5', years: [2017, 2018, 2019, 2020, 2021, 2022, 2023], engines: ['2.0L Skyactiv-G', '2.5L Skyactiv-G', '2.2L Skyactiv-D'], dtcPrefix: 'MAZ' },
        { id: 'mazda3', name: 'Mazda3', years: [2014, 2015, 2016, 2017, 2018], engines: ['2.0L Skyactiv-G', '2.5L Skyactiv-G'], dtcPrefix: 'MAZ' }
      ]
    },
    {
      id: 'subaru',
      name: 'Subaru',
      logo: 'S',
      color: '#003399',
      models: [
        { id: 'forester', name: 'Forester', years: [2014, 2015, 2016, 2017, 2018, 2019, 2020], engines: ['2.0L Boxer', '2.5L Boxer'], dtcPrefix: 'SUB' },
        { id: 'outback', name: 'Outback', years: [2015, 2016, 2017, 2018, 2019, 2020], engines: ['2.5L Boxer', '3.6L Boxer'], dtcPrefix: 'SUB' }
      ]
    },
    {
      id: 'lexus',
      name: 'Lexus',
      logo: 'L',
      color: '#000000',
      models: [
        { id: 'lx', name: 'LX 570', years: [2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021], engines: ['5.7L V8'], dtcPrefix: 'LEX' },
        { id: 'rx', name: 'RX 350', years: [2016, 2017, 2018, 2019, 2020, 2021, 2022], engines: ['3.5L V6'], dtcPrefix: 'LEX' }
      ]
    },
    {
      id: 'hyundai_construction',
      name: 'Hyundai CE',
      logo: '🏗️',
      color: '#002C5F',
      models: [
        { id: 'rx220mc', name: 'R220LC-9S Excavator', years: [2013, 2014, 2015, 2016, 2017, 2018], engines: ['Cummins B5.9-C'], dtcPrefix: 'HYU' },
        { id: 'hx220l', name: 'HX220L Excavator', years: [2016, 2017, 2018, 2019, 2020, 2021, 2022], engines: ['Cummins QSB6.7'], dtcPrefix: 'HYU' }
      ]
    },
    {
      id: 'xcmg',
      name: 'XCMG',
      logo: '🏗️',
      color: '#FFCC00',
      models: [
        { id: 'xe215c', name: 'XE215C Excavator', years: [2016, 2017, 2018, 2019, 2020, 2021, 2022], engines: ['Isuzu CC-6BG1TRP'], dtcPrefix: 'XCM' },
        { id: 'lw300', name: 'LW300FN Wheel Loader', years: [2015, 2016, 2017, 2018, 2019, 2020], engines: ['Weichai WP6G'], dtcPrefix: 'XCM' }
      ]
    },
    {
      id: 'terex',
      name: 'Terex',
      logo: '🏗️',
      color: '#D40026',
      models: [
        { id: 'tr60', name: 'TR60 Rigid Truck', years: [2010, 2011, 2012, 2013, 2014, 2015], engines: ['Cummins QSK19-C'], dtcPrefix: 'TER' },
        { id: 'ta300', name: 'TA300 Articulated Truck', years: [2015, 2016, 2017, 2018, 2019, 2020], engines: ['Scania DC9'], dtcPrefix: 'TER' }
      ]
    },
    {
      id: 'newholland',
      name: 'New Holland CE',
      logo: '🚜',
      color: '#FFD100',
      models: [
        { id: 'b95c', name: 'B95C Backhoe Loader', years: [2016, 2017, 2018, 2019, 2020, 2021], engines: ['FPT 3.4L'], dtcPrefix: 'NWH' },
        { id: 'e215c', name: 'E215C Excavator', years: [2014, 2015, 2016, 2017, 2018], engines: ['Hino J05E'], dtcPrefix: 'NWH' }
      ]
    },
    {
      id: 'kubota',
      name: 'Kubota',
      logo: '🚜',
      color: '#EA5D1E',
      models: [
        { id: 'kx040', name: 'KX040-4 Compact Excavator', years: [2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022], engines: ['Kubota V1505-CR'], dtcPrefix: 'KUB' },
        { id: 'u35', name: 'U35-4 Compact Excavator', years: [2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022], engines: ['Kubota D1703-M-DI'], dtcPrefix: 'KUB' }
      ]
    },
    {
      id: 'yanmar',
      name: 'Yanmar',
      logo: '🚜',
      color: '#E81C28',
      models: [
        { id: 'vio35', name: 'ViO35-6A Mini Excavator', years: [2016, 2017, 2018, 2019, 2020, 2021, 2022], engines: ['Yanmar 3TNV88F'], dtcPrefix: 'YAN' },
        { id: 'sv40', name: 'SV40 Mini Excavator', years: [2020, 2021, 2022, 2023, 2024], engines: ['Yanmar 3TNV88F'], dtcPrefix: 'YAN' }
      ]
    },
    {
      id: 'bell',
      name: 'Bell Equipment',
      logo: '🏗️',
      color: '#F4B000',
      models: [
        { id: 'b30e', name: 'B30E Articulated Dump Truck', years: [2017, 2018, 2019, 2020, 2021, 2022], engines: ['Mercedes-Benz OM936LA'], dtcPrefix: 'BEL' },
        { id: 'b45e', name: 'B45E Articulated Dump Truck', years: [2018, 2019, 2020, 2021, 2022], engines: ['Mercedes-Benz OM471LA'], dtcPrefix: 'BEL' }
      ]
    }
  ]
};

export const genericDTCs = [
  {
    code: 'P0300',
    severity: 'critical',
    title: 'Random/Multiple Cylinder Misfire Detected',
    symptoms: [
      'Engine hesitation or stumbling',
      'Loss of power during acceleration',
      'Check Engine Light flashing (severe misfire)',
      'Rough idle',
      'Smell of unburned fuel from exhaust'
    ],
    probableCauses: [
      'Faulty spark plugs or wires',
      'Ignition coil failure',
      'Vacuum leak',
      'Low fuel pressure',
      'Internal engine problems (low compression)'
    ],
    remediation: [
      'STEP 1: Verify fuel pressure is within specs',
      'STEP 2: Inspect spark plugs for fouling or wear',
      'STEP 3: Check for vacuum leaks using smoke test',
      'STEP 4: Test ignition coils using multimeter',
      'STEP 5: Check EGR system functionality'
    ],
    toolRequirements: ['Basic Scan Tool', 'Multimeter', 'Fuel Pressure Gauge', 'Spark Plug Socket'],
    safetyPrecaution: 'Risk of fire from fuel pressure testing. Work in well-ventilated area.',
    operationalAction: '🟢 Diagnostic Safe. Can be performed by entry-level technician.',
    timeEstimate: '45-90 minutes',
    estimatedCost: '₱2,500 - ₱15,000 depending on cause',
    dangerLevel: 'CRITICAL - Can damage catalytic converter instantly'
  },
  {
    code: 'P0442',
    severity: 'medium',
    title: 'Evaporative Emission (EVAP) System Leak Detected (Small Leak)',
    symptoms: [
      'Slight smell of gasoline around vehicle',
      'Failed emissions test',
      'Check Engine Light on'
    ],
    probableCauses: [
      'Loose, damaged, or incorrect gas cap',
      'Small leak in EVAP hose/line',
      'Leaking charcoal canister',
      'Faulty vent or purge solenoid'
    ],
    remediation: [
      'STEP 1: Tighten gas cap or replace if seal is cracked',
      'STEP 2: Inspect all EVAP lines for cracks or loose connections',
      'STEP 3: Perform smoke test to locate pinhole leaks',
      'STEP 4: Test EVAP purge valve operation'
    ],
    timeEstimate: '30-120 minutes',
    estimatedCost: '₱500 (Gas cap) - ₱8,000',
    dangerLevel: 'LOW - Safety not immediately compromised'
  },
  {
    code: 'P0500',
    severity: 'high',
    title: 'Vehicle Speed Sensor (VSS) Malfunction',
    symptoms: [
      'Speedometer not working or erratic',
      'Harsh or delayed transmission shifts',
      'ABS or Traction Control light on',
      'Cruise control inoperative'
    ],
    probableCauses: [
      'Faulty speed sensor',
      'Corroded or damaged wiring/connectors',
      'Defective speedometer/instrument cluster',
      'Metal debris on sensor tip'
    ],
    remediation: [
      'STEP 1: Check sensor for physical damage or debris',
      'STEP 2: Inspect wiring harness for breaks or corrosion',
      'STEP 3: Test sensor output voltage while rotating wheel',
      'STEP 4: Replace VSS unit if no signal is present'
    ],
    timeEstimate: '60 minutes',
    estimatedCost: '₱2,000 - ₱6,000',
    dangerLevel: 'HIGH - Affects braking and shifting safety'
  },
  {
    code: 'P0AA1',
    severity: 'critical',
    title: 'Hybrid/EV Battery Positive Contactor Circuit Stuck Open',
    symptoms: [
      'Vehicle ready light will not illuminate',
      'High voltage system disabled',
      'Vehicle will not move',
      'Red triangle or hybrid system warning light'
    ],
    probableCauses: [
      'Faulty high voltage contactor',
      'Battery management system (BMS) failure',
      'High voltage interlock loop (HVIL) fault',
      'Blown high voltage fuse'
    ],
    remediation: [
      'STEP 1: Verify HVIL continuity across all access points',
      'STEP 2: Use scan tool to check BMS contactor control signals',
      'STEP 3: Verify 12V auxiliary battery health (drives contactors)',
      'STEP 4: Measure resistance of contactor coil (if safe/accessible)',
      'STEP 5: Check for isolation faults in the high voltage bus'
    ],
    toolRequirements: ['Insulated Tools (CAT III/IV 1000V)', 'High Voltage Multimeter', 'OEM Tier Scan Tool'],
    safetyPrecaution: '🔴 CRITICAL: 400V+ Present. Use Class 0 Gloves and Shield. Arc Flash Hazard.',
    operationalAction: '🛑 STOP. Do NOT proceed without EV Certification. High risk of fatality.',
    timeEstimate: '2-4 hours',
    estimatedCost: '₱15,000 - ₱120,000 (Contactor/BMS replacement)',
    dangerLevel: 'CRITICAL - HIGH VOLTAGE DANGER. DO NOT OPEN UNIT WITHOUT PROPER PPE.'
  },
  {
    code: 'C1A01',
    severity: 'high',
    title: 'Forward Sensing Camera / Radar Alignment Fault (ADAS)',
    symptoms: [
      'Adaptive Cruise Control (ACC) disabled',
      'Forward Collision Warning (FCW) unavailable',
      'Lane Keep Assist (LKA) system error',
      'System recalibration message on dash'
    ],
    probableCauses: [
      'Physical impact to front bumper/windshield',
      'Incorrect wheel alignment after suspension work',
      'Dirty or obstructed sensor lens',
      'Mounting bracket deformation'
    ],
    remediation: [
      'STEP 1: Clean windshield camera area and front radar emblem',
      'STEP 2: Inspect mounting brackets for physical damage or looseness',
      'STEP 3: Perform 4-wheel alignment check',
      'STEP 4: Conduct Dynamic or Static ADAS Recalibration using specialized targets'
    ],
    toolRequirements: ['ADAS Calibration Rig', 'OEM Targets', 'Alignment Machine'],
    safetyPrecaution: 'Ensure flat level floor for static calibration. No shadows on targets.',
    operationalAction: '🟠 Specialist Required. Calibration equipment must be precise.',
    timeEstimate: '1-3 hours',
    estimatedCost: '₱8,000 - ₱25,000 (Recalibration)',
    dangerLevel: 'HIGH - Automatic safety systems might fail to engage'
  },
  {
    code: 'U1104',
    severity: 'medium',
    title: 'Secure Gateway (SGW) Authorization Failure',
    symptoms: [
      'Limited diagnostic data access',
      'Unable to clear codes or perform bi-directional tests',
      'Communication error with Body Control Module (BCM)',
      'Vehicle security system "locked" message in scan tool'
    ],
    probableCauses: [
      'Scan tool not authorized with manufacturer server',
      'Expired security subscription (AutoAuth/Renault SGW)',
      'Bad internet connection at scan tool',
      'Module cybersecurity firewall breach'
    ],
    remediation: [
      'STEP 1: Ensure scan tool has active internet connection',
      'STEP 2: Verify account login for Secure Gateway Access (e.g., FCA AutoAuth)',
      'STEP 3: Attempt manual bypass cable if vehicle is out of warranty',
      'STEP 4: Check for OTA update status that might be blocking access'
    ],
    toolRequirements: ['Certified Secure Scan Tool', 'Manufacturer Portal Subscription', 'SGW Bypass Cable (Optional)'],
    safetyPrecaution: 'Do not attempt to physical bypass SGW on vehicles under warranty.',
    operationalAction: '🔵 Admin Task. Requires manufacturer portal authorization.',
    timeEstimate: '15-45 minutes',
    estimatedCost: '₱2,500 - ₱5,000 (Subscription fees)',
    dangerLevel: 'MEDIUM - Prevents complete vehicle diagnosis'
  },
  {
    code: 'TSL-BMS_u029',
    severity: 'high',
    title: 'Tesla BMS Isolation Fault (Potential Coolant Leak)',
    symptoms: [
      'Maximum charge level reduced',
      'Vehicle power limited (Tortoise mode)',
      'Alert message: "Electrical system power reduced"',
      'Unable to Supercharge'
    ],
    probableCauses: [
      'External coolant leak into battery penthouse',
      'Internal cell isolation breakdown',
      'Contaminated high voltage connector',
      'Humidity sensor trigger inside pack'
    ],
    remediation: [
      'STEP 1: Check for blue/green coolant residue around battery drain p-loops',
      'STEP 2: Use Tesla Toolbox 3 to read isolation resistance (MΩ) values',
      'STEP 3: Inspect HV Pyrotechnic Fuse status',
      'STEP 4: Vacuum test battery pack cooling circuit for leaks'
    ],
    toolRequirements: ['Tesla Service Laptop (Toolbox 3)', 'CAN-Bus Deployment Cable', 'Pressure/Vacuum Test Kit'],
    safetyPrecaution: '⚠️ COOLANT LEAK NEAR HV: Conductive fluid may cause internal pack short. High risk of thermal runaway.',
    operationalAction: '🛑 SPECIALIST REQUIRED. Requires Tesla-specific diagnostic credentials.',
    confidence: 0.88,
    sourceType: 'heuristic',
    feasibility: 'specialist_required',
    disclaimer: 'Guidance provided for diagnostic identification only. Servicing Tesla HV batteries requires specialized factory training.',
    timeEstimate: '3-6 hours',
    estimatedCost: '₱40,000 - ₱800,000 (Pack replacement if internal)',
    dangerLevel: 'CRITICAL - HIGH VOLTAGE + CHEMICAL HAZARD'
  },
  {
    code: 'P0CC1',
    severity: 'medium',
    title: 'Hybrid/EV Battery Pack Cooling Fan Control Circuit Low',
    symptoms: [
      'Fan running at high speed constantly or not at all',
      'Charging speed throttled during DC fast charging',
      'Hybrid system warning message',
      'Battery temperature higher than normal'
    ],
    probableCauses: [
      'Faulty cooling fan motor',
      'Broken/corroded wiring at fan connector',
      'Blown cooling fan fuse',
      'Relay failure in power distribution center'
    ],
    remediation: [
      'STEP 1: Verify fuse integrity in the High Voltage battery junction block',
      'STEP 2: Check for debris blockage in the battery air intake duct',
      'STEP 3: Command fan "ON" using bi-directional scan tool',
      'STEP 4: Measure PWM signal at fan control wire'
    ],
    toolRequirements: ['Standard Scan Tool', 'Infrared Thermometer', 'Digital Multimeter'],
    safetyPrecaution: 'Keep hands clear of fan blades. Fan may start unexpectedly even if vehicle is off.',
    operationalAction: '🟢 Proceed. Can be inspected with standard mechanical tools.',
    confidence: 0.94,
    sourceType: 'oem',
    feasibility: 'proceed',
    disclaimer: 'Ensure 12V battery is disconnected before servicing fan wiring.',
    timeEstimate: '1-2 hours',
    estimatedCost: '₱5,000 - ₱18,000',
    dangerLevel: 'MEDIUM - Risk of battery overheating'
  }
];

export const komatsuDTCs = [
  {
    code: 'CA111',
    manufacturer: 'komatsu',
    severity: 'critical',
    title: 'ECM Internal Failure (Critical Error)',
    dtcPrefix: 'KOM',
    symptoms: [
      'Engine will not start or stops suddenly',
      'Loss of throttle control',
      'All dashboard indicators may flash',
      'Communication failure with diagnostic tool'
    ],
    probableCauses: [
      'Internal ECM electronic failure',
      'Voltage spike in power supply',
      'Grounding circuit discontinuity'
    ],
    remediation: [
      'STEP 1: Check main power supply voltage (24V system should be 22-28V)',
      'STEP 2: Inspect ECM ground connections for corrosion',
      'STEP 3: Perform "Cold Start" reset (Disconnect battery 10 mins)',
      'STEP 4: If code persists, ECM replacement is mandatory'
    ],
    timeEstimate: '2-4 hours for diagnosis',
    estimatedCost: '₱85,000 - ₱150,000 (ECM Unit cost)',
    dangerLevel: 'CRITICAL - Complete machine shutdown'
  },
  {
    code: 'CA115',
    manufacturer: 'komatsu',
    severity: 'high',
    title: 'Engine Ne and Bkup Speed Sensor Error',
    dtcPrefix: 'KOM',
    symptoms: [
      'Engine hunting or unstable RPM',
      'Reduced engine power (Limp mode)',
      'Hard starting when hot'
    ],
    probableCauses: [
      'Faulty engine speed sensor (Ne sensor)',
      'Sensor connector pin corrosion',
      'Excessive clearance between sensor and gear'
    ],
    remediation: [
      'STEP 1: Measure resistance of Ne sensor (2.0 - 3.0 kΩ)',
      'STEP 2: Check sensor tip for metal debris/shavings',
      'STEP 3: Inspect wiring harness for abrasions',
      'STEP 4: Adjust sensor clearance to factory spec (0.5 - 1.2mm)'
    ],
    timeEstimate: '1-2 hours',
    estimatedCost: '₱8,500 - ₱12,000',
    dangerLevel: 'HIGH - Engine timing risk'
  },
  {
    code: 'CA441',
    manufacturer: 'komatsu',
    severity: 'medium',
    title: 'Battery Voltage Low Error',
    dtcPrefix: 'KOM',
    symptoms: [
      'Slow starter cranking',
      'Dim lights and display flickering',
      'False sensor error codes appearing'
    ],
    probableCauses: [
      'Alternator charging failure',
      'Batteries nearing end of life',
      'Parasitic power draw when key is OFF'
    ],
    remediation: [
      'STEP 1: Measure battery voltage at rest (>24V)',
      'STEP 2: Measure charging voltage (should be 27.5V - 28.5V)',
      'STEP 3: Check alternator belt tension',
      'STEP 4: Load test individual batteries'
    ],
    timeEstimate: '30-45 minutes',
    estimatedCost: '₱5,000 (Belt) - ₱25,000 (Batteries)',
    dangerLevel: 'MEDIUM - Sudden starting failure'
  },
  {
    code: 'D110',
    manufacturer: 'komatsu',
    severity: 'high',
    title: 'Engine Oil Pressure Low (Engine Stop)',
    dtcPrefix: 'KOM',
    symptoms: [
      'Automatic engine shutdown triggered',
      'Oil pressure alarm sounding',
      'Visible oil leaks around engine'
    ],
    probableCauses: [
      'Insufficient engine oil level',
      'Oil pump internal wear',
      'Pressure relief valve stuck open',
      'Faulty pressure sensor (False alarm)'
    ],
    remediation: [
      'STEP 1: IMMEDIATELY Check oil level via dipstick',
      'STEP 2: Inspect oil filter for metal particles',
      'STEP 3: Install manual gauge to verify actual pressure',
      'STEP 4: Replace oil pressure sensor/switch'
    ],
    timeEstimate: '1 hour diagnosis',
    estimatedCost: '₱3,500 (Sensor) to ₱200,000+ (Engine Overhaul)',
    dangerLevel: 'CRITICAL - Catastrophic engine failure risk'
  },
  {
    code: 'F011',
    manufacturer: 'komatsu',
    severity: 'critical',
    title: 'Hydraulic Main Pump Pressure Error',
    dtcPrefix: 'KOM',
    symptoms: [
      'Machine travel speed extremely slow',
      'Hydraulic movements jerky or stalled',
      'High-pitched whining from main pump'
    ],
    probableCauses: [
      'Hydraulic suction line blockage',
      'Main pump internal piston wear',
      'Excessive internal leakage in pump case'
    ],
    remediation: [
      'STEP 1: Check hydraulic oil level and filter condition',
      'STEP 2: Inspect suction strainer for debris',
      'STEP 3: Measure case drain flow rate (MAX 15L/min at full relief)',
      'STEP 4: Test PC or LS valve adjustment on the pump'
    ],
    timeEstimate: '2-3 hours',
    estimatedCost: '₱12,000 (Filters) - ₱450,000 (Pump replacement)',
    dangerLevel: 'HIGH - Loss of function'
  },
  {
    code: 'KA228',
    manufacturer: 'komatsu',
    severity: 'high',
    title: 'Swing Motor Overheating',
    dtcPrefix: 'KOM',
    symptoms: [
      'Swing power reduced when excavating',
      'Swing brake dragging',
      'Visible smoke/smell from swing machinery'
    ],
    probableCauses: [
      'Swing parking brake not releasing',
      'Swing motor relief valve stuck',
      'Insufficient lubrication in swing gearbox'
    ],
    remediation: [
      'STEP 1: Check swing brake release pressure (min 30kg/cm²)',
      'STEP 2: Inspect swing gear oil level and clarity',
      'STEP 3: Test swing motor case drain flow',
      'STEP 4: Check swing relief valve for O-ring damage'
    ],
    timeEstimate: '1.5 - 3 hours',
    estimatedCost: '₱15,000 - ₱65,000',
    dangerLevel: 'MEDIUM - Fire risk'
  },
  {
    code: 'AA10NX',
    manufacturer: 'komatsu',
    severity: 'high',
    title: 'Air Cleaner Clogged',
    dtcPrefix: 'KOM',
    symptoms: [
      'Engine generating black smoke',
      'High exhaust temperature (EGT)',
      'Engine power derate active'
    ],
    probableCauses: [
      'Dust accumulation in primary filter element',
      'Inner safety element also restricted',
      'Dust indicator sensor failure'
    ],
    remediation: [
      'STEP 1: Remove and inspect primary air filter element',
      'STEP 2: Clean housing with damp cloth (do not blow air inside)',
      'STEP 3: Replace BOTH elements if cleaning is ineffective',
      'STEP 4: Reset dust indicator on monitor panel'
    ],
    timeEstimate: '15-30 minutes',
    estimatedCost: '₱3,500 - ₱9,000',
    dangerLevel: 'LOW - Engine performance issue'
  },
  {
    code: 'B@BAZG',
    manufacturer: 'komatsu',
    severity: 'medium',
    title: 'Engine Oil Pressure Sensor Malfunction',
    dtcPrefix: 'KOM',
    symptoms: [
      'Oil pressure display reads 0 or max constantly',
      'Warning buzzer sounds intermittently'
    ],
    probableCauses: [
      'Open circuit in signal wire',
      'Short to ground in sensor harness',
      'Internal sensor diaphragm rupture'
    ],
    remediation: [
      'STEP 1: Measure voltage at sensor connector (should be 5V ref)',
      'STEP 2: Check continuity of signal line to controller',
      'STEP 3: Replace sensor with genuine Komatsu part',
      'STEP 4: Verify ground circuit resistance (<1 ohm)'
    ],
    timeEstimate: '45 minutes',
    estimatedCost: '₱4,200',
    dangerLevel: 'MEDIUM - Operating without safety feedback'
  },
  {
    code: 'CA2249',
    manufacturer: 'komatsu',
    severity: 'high',
    title: 'Common Rail Pressure Low (Engine Stall)',
    dtcPrefix: 'KOM',
    symptoms: [
      'Engine stalls under load',
      'Hard start / Long crank time',
      'Sudden loss of power'
    ],
    probableCauses: [
      'Fuel primary filter restricted',
      'HPCR pump quantity valve failure',
      'Injector excessive backleakage'
    ],
    remediation: [
      'STEP 1: Replace primary and secondary fuel filters',
      'STEP 2: Check for air in fuel system (pump primer)',
      'STEP 3: Perform injector return flow test',
      'STEP 4: Inspect rail pressure sensor and wiring'
    ],
    timeEstimate: '2-4 hours',
    estimatedCost: '₱8,000 (Filters) - ₱120,000 (HPCR Pump)',
    dangerLevel: 'HIGH - Machine stalled'
  }
];

export const fordDTCDatabase = [
  {
    code: 'P0101',
    manufacturer: 'ford',
    severity: 'critical',
    title: 'Mass Airflow (MAF) Sensor Circuit - Performance Problem',
    dtcPrefix: 'F150',
    symptoms: [
      'Engine hesitation during acceleration',
      'Rough idle at stop lights',
      'Poor fuel economy (15-20% decrease)',
      'Check Engine Light illuminated',
      'Possible stalling during city driving'
    ],
    probableCauses: [
      'MAF sensor contaminated with dirt/oil',
      'Air leak between MAF sensor and intake valve',
      'Faulty MAF sensor (common in turbo models)',
      'PCM issue or corrupted fuel trim values'
    ],
    remediation: [
      'STEP 1: Connect diagnostic scanner - retrieve all fault codes',
      'STEP 2: Check for air intake leaks visually (3-5 min inspection)',
      'STEP 3: Remove MAF sensor with 10mm socket (2 min)',
      'STEP 4: Clean with specialized MAF cleaner aerosol (5-7 min dry time)',
      'STEP 5: Reinstall and clear codes - test drive 10 minutes',
      'STEP 6: If code returns, replace MAF sensor unit ($180-250 part cost)'
    ],
    affectedYears: [2018, 2019, 2020, 2021, 2022, 2023],
    timeEstimate: '15-45 minutes (DIY with cleaner)',
    estimatedCost: '$0 (cleaning) to $280 (sensor replacement)',
    dangerLevel: 'High - Vehicle may stall unexpectedly'
  },
  {
    code: 'P0128',
    manufacturer: 'ford',
    severity: 'medium',
    title: 'Coolant Thermostat (Coolant Temp Regulation) - Performance Problem',
    dtcPrefix: 'F150',
    symptoms: [
      'Engine slow to reach operating temperature',
      'Inconsistent temperature gauge readings',
      'Poor heater performance in cabin',
      'Fuel economy drop (5-10%)',
      'Check Engine Light (may be intermittent)'
    ],
    probableCauses: [
      'Faulty thermostat stuck open (most common - 85% of cases)',
      'Coolant level low or coolant leak',
      'Temperature sensor malfunction',
      'Engine control module receiving false temperature signal'
    ],
    remediation: [
      'STEP 1: Wait for engine to cool completely (30 min minimum)',
      'STEP 2: Locate thermostat housing (driver side of engine block)',
      'STEP 3: Drain coolant into suitable container (note color/type)',
      'STEP 4: Remove thermostat bolts (13mm socket)',
      'STEP 5: Extract old thermostat and gasket - clean sealing surface',
      'STEP 6: Install new OEM thermostat with fresh gasket',
      'STEP 7: Refill with correct coolant type (refer to owner manual)',
      'STEP 8: Bleed air from system - run until fan cycles',
      'STEP 9: Clear codes and test drive 20 minutes'
    ],
    affectedYears: [2015, 2016, 2017, 2018, 2019, 2020, 2021],
    timeEstimate: '45-90 minutes (with coolant refill)',
    estimatedCost: '$120-180 (OEM thermostat + gasket + coolant)',
    dangerLevel: 'Medium - No immediate danger, but engine longevity at risk'
  },
  {
    code: 'P0171',
    manufacturer: 'ford',
    severity: 'high',
    title: 'System Too Lean (Bank 1) - Oxygen Sensor Monitoring',
    dtcPrefix: 'F150',
    symptoms: [
      'Rough idle (RPM fluctuates ±100)',
      'Hesitation on light acceleration',
      'Black smoke from exhaust under load',
      'Engine ping/knock on city driving',
      'Fuel economy degradation (20-25%)',
      'Difficulty starting when cold'
    ],
    probableCauses: [
      'Faulty Bank 1 upstream O2 sensor (most likely)',
      'Vacuum leak (intake manifold gasket common)',
      'Fuel injector clogged or leaking',
      'Fuel pressure regulator malfunction',
      'Air leak in exhaust system before O2 sensor'
    ],
    remediation: [
      'STEP 1: Scan for pending or confirmed codes (P0171 vs P0174)',
      'STEP 2: Check fuel pressure at fuel rail (should be 55-60 PSI)',
      'STEP 3: Visual inspection for vacuum leaks around intake manifold',
      'STEP 4: Locate Bank 1 upstream O2 sensor (before catalytic converter)',
      'STEP 5: Remove with O2 sensor socket (22mm with extension)',
      'STEP 6: Clean sensor threads - apply anti-seize compound',
      'STEP 7: Install new OEM O2 sensor and torque to spec',
      'STEP 8: Clear codes and drive 10+ miles for sensor relearning'
    ],
    affectedYears: [2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019],
    timeEstimate: '30-60 minutes (O2 sensor) | 1.5-2 hours (if vacuum leak)',
    estimatedCost: '$150-220 (O2 sensor) to $350-500 (manifold gasket if needed)',
    dangerLevel: 'High - Can cause catalytic converter damage if prolonged'
  },
  {
    code: 'P0708',
    manufacturer: 'ford',
    severity: 'high',
    title: 'Transmission Fluid Temperature Sensor - Electrical Signal',
    dtcPrefix: 'F150',
    symptoms: [
      'Transmission downshifting harshly',
      'Erratic shift points (too early or delayed)',
      'Torque converter not locking properly',
      'Transmission temperature warning light on',
      'Possible transmission overheating',
      'Check Engine Light'
    ],
    probableCauses: [
      'Faulty transmission fluid temperature sensor',
      'Corroded sensor connector pins',
      'Wiring harness damage to sensor circuit',
      'Low transmission fluid (triggers false signal)',
      'Transmission control module issue'
    ],
    remediation: [
      'STEP 1: Warm transmission fluid to operating temp (10 min drive)',
      'STEP 2: Check transmission fluid level and condition',
      'STEP 3: Locate TFT sensor on transmission pan (usually)',
      'STEP 4: Disconnect electrical connector and inspect for corrosion',
      'STEP 5: Clean connector pins with contact cleaner',
      'STEP 6: Reinstall and clear codes - test drive',
      'STEP 7: If code returns, replace sensor unit ($120-180 part cost)'
    ],
    affectedYears: [2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018],
    timeEstimate: '15-45 minutes (sensor replacement)',
    estimatedCost: '$100-200 (sensor + labor)',
    dangerLevel: 'High - Transmission can overheat without proper cooling'
  },
  {
    code: 'P1000',
    manufacturer: 'ford',
    severity: 'critical',
    title: 'PATS System - Key Not Recognized by Immobilizer',
    dtcPrefix: 'F150',
    symptoms: [
      'Engine cranks but will not start',
      'Security light blinking on dashboard (1 Hz blink)',
      'Radio and accessories work but ignition fails',
      'All keys for vehicle affected (or newly added key)',
      'Possible alarm activation'
    ],
    probableCauses: [
      'PATS receiver module malfunction',
      'Key chip failure (transponder in key)',
      'Key not properly programmed for vehicle',
      'Aftermarket alarm interference',
      'PATS antenna coil failure'
    ],
    remediation: [
      'STEP 1: Try key programming reset (vehicle dependent)',
      'STEP 2: Turn ignition ON without starting for 1 second',
      'STEP 3: Turn OFF for 1 second',
      'STEP 4: Repeat ON/OFF cycle 8-10 times quickly',
      'STEP 5: Listen for door lock click (confirms relearn mode)',
      'STEP 6: Turn ignition to RUN position and wait 10 seconds',
      'STEP 7: Engine should now crank and start normally',
      'STEP 8: If unsuccessful, contact Ford dealership for PATS module diagnosis'
    ],
    affectedYears: [2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012],
    timeEstimate: '5-10 minutes (reset) | 2-4 hours (dealership diagnosis)',
    estimatedCost: '$0 (reset) to $800+ (module replacement)',
    dangerLevel: 'Critical - Vehicle cannot be started'
  },
  {
    code: 'P0420',
    manufacturer: 'ford',
    severity: 'high',
    title: 'Catalyst System Efficiency Below Threshold (Bank 1)',
    dtcPrefix: 'F150',
    symptoms: [
      'Rotten egg smell in exhaust (sulfur odor)',
      'Engine lacking power on highway driving',
      'Check Engine Light illuminated',
      'Possible rough idle',
      'Slow acceleration response',
      'May trigger secondary codes P0430, P0442'
    ],
    probableCauses: [
      'Catalytic converter degradation (most common)',
      'Leaking exhaust manifold gasket',
      'Faulty downstream O2 sensor giving false reading',
      'Engine running too rich (fuel mixture problem)',
      'Severe misfire from cylinder (unburned fuel in cat)'
    ],
    remediation: [
      'STEP 1: Perform full diagnostic with OBD scanner',
      'STEP 2: Check for misfires (codes P0300-P0308)',
      'STEP 3: If misfire found, diagnose that issue FIRST',
      'STEP 4: Check downstream O2 sensor voltage (should be <0.3V at idle)',
      'STEP 5: If cat is failing, replacement necessary',
      'STEP 6: Perform inspection for exhaust leaks upstream',
      'STEP 7: Clear codes after repair and drive EPA cycle (city/highway mix)'
    ],
    affectedYears: [2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015],
    timeEstimate: '1-3 hours (for cat replacement)',
    estimatedCost: '$600-1500 (aftermarket) to $2200+ (OEM Ford cat)',
    dangerLevel: 'High - Can lead to complete catalyst failure and engine damage'
  },
  {
    code: 'C1234',
    manufacturer: 'ford',
    severity: 'medium',
    title: 'ABS System - Wheel Speed Sensor Circuit Malfunction',
    dtcPrefix: 'F150',
    symptoms: [
      'ABS warning light on dashboard',
      'Loss of anti-lock braking functionality',
      'Longer stopping distances in emergency braking',
      'Brake pedal may feel soft or spongy',
      'Possible traction control light as well'
    ],
    probableCauses: [
      'Wheel speed sensor corrosion (common in wet climates)',
      'Sensor ring wear or gap misalignment',
      'Wiring harness pinched or corroded',
      'ABS module electrical fault'
    ],
    remediation: [
      'STEP 1: Identify which wheel sensor (usually front axle first)',
      'STEP 2: Raise vehicle safely on lift or ramps',
      'STEP 3: Locate wheel speed sensor on brake assembly',
      'STEP 4: Clean connector contacts - inspect wiring',
      'STEP 5: If wiring damaged, replace sensor harness',
      'STEP 6: Replace sensor if corroded ($50-100 part)',
      'STEP 7: Clear codes and test braking on closed course'
    ],
    affectedYears: [2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016],
    timeEstimate: '30-60 minutes per sensor',
    estimatedCost: '$80-150 (sensor) to $300-400 (full sensor replacement)',
    dangerLevel: 'Medium-High - Safety critical, but vehicle remains driveable'
  }
];

export const otherMfrDTCs = [
  {
    code: 'P0505',
    manufacturer: 'toyota',
    severity: 'medium',
    title: 'Idle Control System Malfunction',
    dtcPrefix: 'HLX',
    symptoms: [
      'Rough idle at traffic lights',
      'RPM fluctuation (±200 RPM swings)',
      'Engine stalling when coming to complete stop'
    ],
    probableCauses: [
      'Idle Air Control valve dirty',
      'Vacuum leak in intake',
      'Spark plugs overdue for replacement'
    ],
    remediation: [
      'Clean IAC valve with carburetor cleaner',
      'Inspect vacuum lines for cracks',
      'Replace spark plugs if mileage >80k'
    ],
    affectedYears: [2010, 2011, 2012, 2013, 2014],
    timeEstimate: '1-2 hours',
    estimatedCost: '$150-350',
    dangerLevel: 'Medium'
  }
];
