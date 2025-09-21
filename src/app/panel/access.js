import accessList from './access.json';

export function getPanelsForCode(code) {
  const entry = accessList.find(item => item.code === code);
  return entry ? entry.panels : [];
}

export function getRoleForCode(code) {
  const entry = accessList.find(item => item.code === code);
  return entry ? entry.role : null;
}

export function getAccessList() {
  return accessList;
}

export function addAccessCode(newCode, role, panels) {
  accessList.push({ code: newCode, role, panels });
}

export function removeAccessCode(code) {
  const idx = accessList.findIndex(item => item.code === code);
  if (idx !== -1) accessList.splice(idx, 1);
}

export function updatePanelsForCode(code, panels) {
  const entry = accessList.find(item => item.code === code);
  if (entry) entry.panels = panels;
}
