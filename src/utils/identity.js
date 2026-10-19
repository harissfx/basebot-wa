const { normJid } = require('./helper');


async function resolveCounterpartJid(Hanz, jid) {
    try {
        const mapping = Hanz.signalRepository?.lidMapping;
        if (!mapping || !jid) return null;
        return jid.endsWith('@lid')
            ? await mapping.getPNForLID(jid)
            : await mapping.getLIDForPN(jid);
    } catch {
        return null;
    }
}

function lookupStoreContact(Hanz, jid) {
    if (!jid) return null;
    const stores = [Hanz?.contacts, Hanz?.store?.contacts];
    for (const store of stores) {
        if (!store) continue;
        const c = store instanceof Map ? store.get(jid) : store[jid];
        const name = c?.name || c?.notify || c?.verifiedName;
        if (name) return name;
    }
    return null;
}

async function resolveName(Hanz, jid, altJid) {
    global.nameCache = global.nameCache || new Map();
    if (global.nameCache.has(jid)) return global.nameCache.get(jid);
    if (altJid && global.nameCache.has(altJid)) {
        const name = global.nameCache.get(altJid);
        global.nameCache.set(jid, name);
        return name;
    }

    const fromStore = lookupStoreContact(Hanz, jid) || lookupStoreContact(Hanz, altJid);
    if (fromStore) {
        global.nameCache.set(jid, fromStore);
        return fromStore;
    }

    const counterpart = await resolveCounterpartJid(Hanz, jid);
    if (counterpart && global.nameCache.has(counterpart)) {
        const name = global.nameCache.get(counterpart);
        global.nameCache.set(jid, name);
        return name;
    }
    return null;
}

async function resolveNameFromGroup(Hanz, groupJid, jid, altJid) {
    try {
        const meta = await Hanz.groupMetadata(groupJid);
        const norm = normJid;
        const targets = [norm(jid), norm(altJid)].filter(Boolean);

        const p = meta.participants?.find((part) => {
            const ids = [part.id, part.lid, part.jid, part.phoneNumber]
                .filter(Boolean).map(norm);
            return ids.some((id) => targets.includes(id));
        });

        const name = p?.notify || p?.name || p?.verifiedName || null;
        if (name) {
            global.nameCache = global.nameCache || new Map();
            global.nameCache.set(jid, name);
            if (altJid) global.nameCache.set(altJid, name);
            return name;
        }
    } catch {
    }
    return null;
}

async function resolvePhoneJid(Hanz, jid) {
    if (!jid?.endsWith('@lid')) return jid;
    try {
        const pn = await Hanz.signalRepository?.lidMapping?.getPNForLID(jid);
        return pn || jid;
    } catch {
        return jid;
    }
}

async function resolveMember(Hanz, groupJid, rawJid) {
    const phoneJid = await resolvePhoneJid(Hanz, rawJid);
    const altJid = phoneJid !== rawJid ? rawJid : null;

    let name = await resolveName(Hanz, phoneJid, altJid);
    if (!name) {
        name = await resolveNameFromGroup(Hanz, groupJid, phoneJid, altJid);
    }

    return { phoneJid, altJid, name };
}

module.exports = {
    resolveCounterpartJid,
    lookupStoreContact,
    resolveName,
    resolveNameFromGroup,
    resolvePhoneJid,
    resolveMember,
};