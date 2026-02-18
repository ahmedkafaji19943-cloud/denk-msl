/* Simple localStorage data layer for demo purposes */
const KEY = 'denk_msl_v1'

const defaultData = {
  admin: { name: 'Ahmed AbdulKareem', email: 'ahmedkafaji19943@gmail.com' },
  msls: [
    { id: 'msl1', name: 'Khaldoon Sattar', manager: true },
    { id: 'msl2', name: 'Ahmed AbdulKareem' },
    { id: 'msl3', name: 'Ahmed Rabah' },
    { id: 'msl4', name: 'Ali Kamil' }
  ],
  medReps: [
    'Yaman Ali',
    'Mohammed Luqman',
    'Erjwan Thaar',
    'Sabreen Majid',
    'Ibraheem Jumaa'
  ],
  products: [
    {
      id: 'panto',
      name: 'PantoDenk',
      messages: [
        'A. Pantoprazole is as effective as esomeprazole to relieve symptoms of GERD after 4 weeks of treatment and superior regarding the prevention of symptomatic relapse.',
        'B. Pantoprazole does not have any Drug food interaction compared to esomeprazole.',
        'C. Pantoprazole has the least drug-drug interaction compared to all other PPI.',
        'D. Pantoprazole has the least effect on the ECL cells and does not cause gastric atrophy or metaplasia; safe on prolonged use.',
        'E. Rapid onset, dose linearity.',
        'F. Pregnancy category B'
      ]
    }
  ],
  calls: []
}

function read() {
  const raw = localStorage.getItem(KEY)
  if (!raw) {
    localStorage.setItem(KEY, JSON.stringify(defaultData))
    return structuredClone(defaultData)
  }
  return JSON.parse(raw)
}

function write(data) {
  localStorage.setItem(KEY, JSON.stringify(data))
}

export function getState() { return read() }

export function saveCall(call) {
  const s = read()
  s.calls.push({ ...call, id: Date.now().toString() })
  write(s)
}

export function updateMessages(productId, msLid, messages) {
  const s = read()
  const p = s.products.find(p => p.id === productId)
  if (!p) return
  // store per-MSL messages inside product (simple approach)
  p._perMsl = p._perMsl || {}
  p._perMsl[msLid] = messages
  write(s)
}

export function getMessagesFor(productId, msLid) {
  const s = read()
  const p = s.products.find(p => p.id === productId)
  if (!p) return []
  return (p._perMsl && p._perMsl[msLid]) || p.messages
}

export function getAllCalls() { return read().calls }

export function resetDemo() { localStorage.removeItem(KEY) }
