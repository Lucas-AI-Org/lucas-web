/* scripts/import-universities.js */
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

// If you kept the custom Prisma output:
const { PrismaClient } = require('../api/prisma/generated/prisma');
// If you switch back to default output, use: const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Helpers
const isBlank = (v) => v === undefined || v === null || String(v).trim() === '';
const isSuppressed = (v) => ['NA', 'na', 'NaN', 'NULL', 'PS'].includes(String(v).trim());
const toNull = (v) => (isBlank(v) || isSuppressed(v) ? null : v);
const toInt = (v) => {
  v = toNull(v);
  if (v === null) return null;
  const n = parseInt(String(v).replace(/[, ]+/g, ''), 10);
  return Number.isFinite(n) ? n : null;
};
const toFloat = (v) => {
  v = toNull(v);
  if (v === null) return null;
  const n = parseFloat(String(v).replace(/[, ]+/g, ''));
  return Number.isFinite(n) ? n : null;
};
const toBool = (v) => {
  v = toNull(v);
  if (v === null) return null;
  const s = String(v).trim().toLowerCase();
  if (['1', 'true', 't', 'yes', 'y'].includes(s)) return true;
  if (['0', 'false', 'f', 'no', 'n'].includes(s)) return false;
  return null;
};
const toControlEnum = (v) => {
  const n = toInt(v);
  if (n === 1) return 'PUBLIC';
  if (n === 2) return 'PRIVATE_NONPROFIT';
  if (n === 3) return 'PRIVATE_FORPROFIT';
  return null;
};

// Map one CSV row -> Prisma data
function mapRow(row) {
  return {
    // identifiers
    unitId: toInt(row.UNITID),

    // identity / type
    name: String(row.INSTNM || '').trim(),
    alias: toNull(row.ALIAS),
    control: toControlEnum(row.CONTROL),
    schDeg: toInt(row.SCH_DEG),
    highDeg: toInt(row.HIGHDEG),
    predDeg: toInt(row.PREDDEG),
    icLevel: toInt(row.ICLEVEL),
    accredAgency: toNull(row.ACCREDAGENCY),
    openAdmp: toBool(row.OPENADMP),
    curroper: toBool(row.CURROPER),
    main: toBool(row.MAIN),
    numBranch: toInt(row.NUMBRANCH),

    // location & size
    city: toNull(row.CITY),
    state: toNull(row.STABBR),
    region: toInt(row.REGION),
    zip: toNull(row.ZIP),
    locale: toInt(row.LOCALE),
    latitude: toFloat(row.LATITUDE),
    longitude: toFloat(row.LONGITUDE),
    ugds: toInt(row.UGDS),
    ccSizSet: toInt(row.CCSIZSET),

    // designations
    hBCU: toBool(row.HBCU),
    hSI: toBool(row.HSI),
    aANAPII: toBool(row.AANAPII),
    pBI: toBool(row.PBI),
    tribal: toBool(row.TRIBAL),
    menOnly: toBool(row.MENONLY),
    womenOnly: toBool(row.WOMENONLY),
    relAffil: toInt(row.RELAFFIL),
    schType: toInt(row.SCHTYPE),
    controlPeps: toInt(row.CONTROL_PEPS),

    // urls / delivery
    instUrl: toNull(row.INSTURL),
    npcUrl: toNull(row.NPCURL),
    distanceOnly: toBool(row.DISTANCEONLY),
    prgmOfr: toNull(row.PRGMOFR),
  };
}

async function upsertUniversity(data, useUnitIdKey = true) {
  // If you added unitId @unique (recommended), we can upsert cleanly:
  if (useUnitIdKey && data.unitId != null) {
    return prisma.university.upsert({
      where: { unitId: data.unitId },
      create: data,
      update: {
        // update the mutable fields (leave id/createdAt alone)
        name: data.name,
        alias: data.alias,
        control: data.control,
        schDeg: data.schDeg,
        highDeg: data.highDeg,
        predDeg: data.predDeg,
        icLevel: data.icLevel,
        accredAgency: data.accredAgency,
        openAdmp: data.openAdmp,
        curroper: data.curroper,
        main: data.main,
        numBranch: data.numBranch,
        city: data.city,
        state: data.state,
        region: data.region,
        zip: data.zip,
        locale: data.locale,
        latitude: data.latitude,
        longitude: data.longitude,
        ugds: data.ugds,
        ccSizSet: data.ccSizSet,
        hBCU: data.hBCU,
        hSI: data.hSI,
        aANAPII: data.aANAPII,
        pBI: data.pBI,
        tribal: data.tribal,
        menOnly: data.menOnly,
        womenOnly: data.womenOnly,
        relAffil: data.relAffil,
        schType: data.schType,
        controlPeps: data.controlPeps,
        instUrl: data.instUrl,
        npcUrl: data.npcUrl,
        distanceOnly: data.distanceOnly,
        prgmOfr: data.prgmOfr,
      },
    });
  }

  // Fallback path (no unique unitId): try to find by (name, city, state), else create.
  const existing = await prisma.university.findFirst({
    where: {
      name: data.name,
      city: data.city,
      state: data.state,
    },
    select: { id: true },
  });

  if (existing) {
    return prisma.university.update({
      where: { id: existing.id },
      data,
    });
  }

  return prisma.university.create({ data });
}

async function main() {
  const file = process.argv[2];
  if (!file) {
    console.error('Usage: node scripts/import-universities.js <path/to/scorecard.csv>');
    process.exit(1);
  }

  const useUnitIdKey = true; // set to false if you did NOT add unitId @unique

  let created = 0,
    updated = 0,
    processed = 0,
    failed = 0;

  const stream = fs.createReadStream(path.resolve(file)).pipe(
    csv({
      mapHeaders: ({ header }) => header.replace(/^\uFEFF/, '').trim(),
      mapValues: ({ value }) => (typeof value === 'string' ? value.trim() : value),
    })
  );

  for await (const row of stream) {
    processed++;
    const data = mapRow(row);

    // Skip rows without an INSTNM or a UNITID (if using unitId key)
    if (!data.name || (useUnitIdKey && data.unitId == null)) {
      failed++;
      continue;
    }

    try {
      const result = await upsertUniversity(data, useUnitIdKey);
      // naive heuristic: if it has createdAt very close to now and no previous unitId, it's likely created.
      // But Prisma doesn't tell us create vs update; so we can track by trying to find first:
      if (useUnitIdKey) {
        // quick check: if this was the first time we saw this UNITID:
        // We do an extra query only for stats to keep code simple.
        const count = await prisma.university.count({ where: { unitId: data.unitId } });
        if (count === 1) created++;
        else updated++;
      } else {
        // can't easily tell; just increment updated/created roughly:
        updated++; // not precise in fallback mode
      }

      if (processed % 500 === 0) {
        console.log(
          `Processed ${processed} rows… (created ~${created}, updated ~${updated}, failed ${failed})`
        );
      }
    } catch (err) {
      failed++;
      // Show a compact error with school name to help debugging bad rows
      console.error(`Row ${processed} (${data.name || 'unknown'}): ${err.message}`);
    }
  }

  console.log(
    `Done. Processed ${processed} rows. Created ~${created}, updated ~${updated}, failed ${failed}.`
  );
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
