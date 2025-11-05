# 🗳️ DAO Petition Platform - Complete Guide TEST

Platform voting terdesentralisasi untuk petition/campaign dengan sistem reward berbasis aktivitas dan **Dynamic Duration Pricing**.

---

## 📋 Table of Contents
1. [Konsep Platform](#konsep-platform)
2. [Setup di Remix](#setup-di-remix)
3. [Deployment Step-by-Step](#deployment-step-by-step)
4. [Testing Scenarios](#testing-scenarios)
5. [FAQ & Troubleshooting](#faq--troubleshooting)

---

## 🎯 Konsep Platform

### Alur Pengguna:
1. **User Biasa (Public)**: Bisa sign petition gratis, 1 wallet = 1 signature
2. **DAO Member**: 
   - Mint NFT (0.02 ETH) → dapat 1 Campaign Token gratis
   - Bisa buat petition dengan **gambar (IPFS hash)** menggunakan:
     - Campaign Token (gratis, max 7 hari) ATAU
     - Bayar ETH dengan **pricing dinamis** berdasarkan durasi
   - Setiap 5 petition berbayar → dapat 1 Campaign Token reward

### 🆕 Dynamic Duration Pricing

**Konsep**: Semakin lama durasi campaign, semakin tinggi biayanya!

**Pricing Formula**:
- **7 hari atau kurang**: 0.002 ETH (base price)
- **Lebih dari 7 hari**: 0.002 ETH + (jumlah hari tambahan × 0.0003 ETH)

**Contoh Pricing**:
| Durasi | Perhitungan | Total Biaya |
|--------|-------------|-------------|
| 3 hari | Base price | 0.002 ETH |
| 7 hari | Base price | 0.002 ETH |
| 10 hari | 0.002 + (3 × 0.0003) | 0.0029 ETH |
| 14 hari | 0.002 + (7 × 0.0003) | 0.0041 ETH |
| 30 hari | 0.002 + (23 × 0.0003) | 0.0089 ETH |
| 60 hari | 0.002 + (53 × 0.0003) | 0.0179 ETH |
| 90 hari | 0.002 + (83 × 0.0003) | 0.0269 ETH |

**Campaign Token Rules**:
- ✅ Token gratis **hanya untuk durasi 7 hari**
- ❌ Jika pilih durasi > 7 hari, **wajib bayar ETH** (token tidak bisa dipakai)
- 🎁 Reward token tetap: setiap 5 petition berbayar = 1 token gratis

### Smart Contracts:
- **CampaignToken.sol**: ERC-20 token untuk bikin petition gratis
- **DAOMembership.sol**: ERC-721 NFT membership
- **PetitionPlatform.sol**: Core logic voting & petition (dengan dynamic pricing)

---

## 🛠️ Setup di Remix

### 1. Buka Remix IDE
- Kunjungi: https://remix.ethereum.org
- Pastikan compiler version: **0.8.30**

### 2. Buat 3 File Baru

**File 1: `CampaignToken.sol`**
```
contracts/
└── CampaignToken.sol
```
Copy paste code dari artifact CampaignToken.sol

**File 2: `DAOMembership.sol`**
```
contracts/
└── DAOMembership.sol
```
Copy paste code dari artifact DAOMembership.sol

**File 3: `PetitionPlatform.sol`**
```
contracts/
└── PetitionPlatform.sol
```
Copy paste code **BARU** PetitionPlatform.sol (yang sudah ada dynamic pricing)

### 3. Compile Contracts

1. Klik tab **"Solidity Compiler"** (icon logo Solidity)
2. Pilih compiler version: **0.8.30**
3. Enable **"Auto compile"** atau klik **"Compile"** manual untuk setiap file
4. Pastikan tidak ada error (hijau centang ✅)

---

## 🚀 Deployment Step-by-Step

### Persiapan
- Network: **Remix VM (Cancun)** untuk testing (atau network lain seperti Sepolia)
- Pastikan punya ETH di wallet untuk deploy

---

### STEP 1: Deploy CampaignToken

1. Buka tab **"Deploy & Run Transactions"**
2. Pilih **Contract**: `CampaignToken`
3. Klik **"Deploy"** (tidak perlu parameter)
4. ✅ **PENTING**: Copy address contract yang baru di-deploy
   ```
   Contoh: 0x5B38Da6a701c568545dCfcB03FcB875f56beddC4
   ```

**Simpan address ini! Akan digunakan di step berikutnya.**

---

### STEP 2: Deploy DAOMembership

1. Pilih **Contract**: `DAOMembership`
2. Di field constructor, input **address CampaignToken** dari Step 1
   ```
   Contoh input:
   _campaignToken: 0x5B38Da6a701c568545dCfcB03FcB875f56beddC4
   ```
3. Klik **"Deploy"**
4. ✅ **PENTING**: Copy address DAOMembership yang baru di-deploy
   ```
   Contoh: 0xAb8483F64d9C6d1EcF9b849Ae677dD3315835cb2
   ```

**Simpan address ini! Akan digunakan di step berikutnya.**

---

### STEP 3: Deploy PetitionPlatform

1. Pilih **Contract**: `PetitionPlatform`
2. Di field constructor, input **2 address**:
   ```
   _daoMembership: [address DAOMembership dari Step 2]
   _campaignToken: [address CampaignToken dari Step 1]
   
   Contoh:
   _daoMembership: 0xAb8483F64d9C6d1EcF9b849Ae677dD3315835cb2
   _campaignToken: 0x5B38Da6a701c568545dCfcB03FcB875f56beddC4
   ```
3. Klik **"Deploy"**
4. ✅ **PENTING**: Copy address PetitionPlatform
   ```
   Contoh: 0x4B20993Bc481177ec7E8f571ceCaE8A9e22C02db
   ```

---

### STEP 4: Setup Connections (WAJIB!)

Sekarang 3 contract sudah di-deploy, tapi belum terhubung. Kita perlu setup connections.

#### 4A. Setup CampaignToken - Petition Connection

1. Klik contract **CampaignToken** di "Deployed Contracts"
2. Cari function **`setPetitionContract`**
3. Input address **PetitionPlatform** dari Step 3
   ```
   _petitionContract: 0x4B20993Bc481177ec7E8f571ceCaE8A9e22C02db
   ```
4. Klik **"transact"**
5. ✅ Tunggu sampai transaction success

#### 4B. Setup CampaignToken - DAO Connection

⚠️ **Langkah ini WAJIB** untuk mengatasi error "Not authorized" saat mintMembership!

1. Klik contract **CampaignToken** di "Deployed Contracts"
2. Cari function **`setDAOMembershipContract`**
3. Input address **DAOMembership** dari Step 2
   ```
   _daoMembershipContract: 0xAb8483F64d9C6d1EcF9b849Ae677dD3315835cb2
   ```
4. Klik **"transact"**
5. ✅ Tunggu sampai transaction success

#### 4C. Setup DAOMembership

1. Klik contract **DAOMembership** di "Deployed Contracts"
2. Cari function **`setPetitionContract`**
3. Input address **PetitionPlatform** dari Step 3
   ```
   _petitionContract: 0x4B20993Bc481177ec7E8f571ceCaE8A9e22C02db
   ```
4. Klik **"transact"**
5. ✅ Tunggu sampai transaction success

---

### ✅ Deployment Complete!

Sekarang platform sudah siap digunakan. Mari kita test!

---

## 🧪 Testing Scenarios

### Persiapan Testing

**Buat 3 Account untuk Testing:**
- **Account 1**: Owner/Platform (default account di Remix)
- **Account 2**: Creator pertama (ganti account di dropdown)
- **Account 3**: Public user (untuk sign petition)

**Cara ganti account di Remix:**
- Di tab "Deploy & Run", lihat dropdown **"Account"**
- Pilih account yang berbeda untuk simulasi user berbeda

---

## TEST 1: Mint NFT Membership (Jadi Creator)

**Menggunakan Account 2** (bukan owner)

1. Ganti account ke **Account 2** di dropdown
2. Buka contract **DAOMembership**
3. Cari function **`mintMembership`**
4. **Set VALUE**: `0.02` Ether (di kolom VALUE, ubah unit ke "Ether")
5. Klik **"transact"**
6. ✅ Tunggu transaction success

**Verifikasi:**
- Cek function **`hasMinted`** → input address Account 2 → harus return `true`
- Cek function **`balanceOf`** → input address Account 2 → harus return `1`
- Cek function **`tokenCounter`** → harus return `1`

**Cek Campaign Token:**
1. Buka contract **CampaignToken**
2. Cari function **`balanceOf`**
3. Input address Account 2
4. ✅ Harus return: `1000000000000000000` (1 token dengan 18 decimals = 1 token gratis!)

---

## TEST 2: Cek Pricing Configuration

**Menggunakan Account 2 atau Account manapun**

Sebelum buat petition, mari cek pricing configuration terlebih dahulu.

1. Buka contract **PetitionPlatform**
2. Cari function **`getPricingInfo`**
3. Klik **"call"** (read-only, gratis)
4. ✅ Output:
   ```
   baseFee: 2000000000000000 (0.002 ETH)
   baseDuration: 7 (hari)
   additionalFee: 300000000000000 (0.0003 ETH per hari)
   tokenDuration: 7 (hari default untuk token gratis)
   ```

**Test Calculate Fee untuk berbagai durasi:**

1. Cari function **`calculateCampaignFee`**
2. Test berbagai durasi:
   
   **Durasi 7 hari:**
   ```
   Input: 7
   Output: 2000000000000000 (0.002 ETH)
   ```
   
   **Durasi 10 hari:**
   ```
   Input: 10
   Output: 2900000000000000 (0.0029 ETH)
   Perhitungan: 0.002 + (3 × 0.0003)
   ```
   
   **Durasi 30 hari:**
   ```
   Input: 30
   Output: 8900000000000000 (0.0089 ETH)
   Perhitungan: 0.002 + (23 × 0.0003)
   ```

---

## TEST 3: Buat Petition dengan Token Gratis (7 Hari)

**Menggunakan Account 2** (yang sudah punya NFT + 1 token)

### Persiapan IPFS Hash:

Gunakan hash ini untuk testing:
```
QmYwAPJzv5CZsnAzt8auVZRn5rcYRZHA3dGmXYvNrQ6hE3
```

### Create Petition:

1. Pastikan masih pakai **Account 2**
2. Buka contract **PetitionPlatform**
3. Cari function **`createPetition`**
4. Input parameter:
   ```
   _title: "Stop Deforestation"
   _description: "We need to protect our forests for future generations"
   _imageHash: "QmYwAPJzv5CZsnAzt8auVZRn5rcYRZHA3dGmXYvNrQ6hE3"
   _durationInDays: 7
   ```
5. **VALUE: 0** (karena pakai token gratis dan durasi ≤ 7 hari)
6. Klik **"transact"**
7. ✅ Tunggu transaction success

**Verifikasi:**
- Cek **`petitionCounter`** → harus return `1`
- Cek **`getPetition`** → input `0` → lihat:
  - `durationDays`: 7
  - `imageHash`: QmYwAPJzv5CZsnAzt8auVZRn5rcYRZHA3dGmXYvNrQ6hE3
- Buka **CampaignToken** → cek `balanceOf` Account 2 → harus `0` (token sudah di-burn)
- Cek **Events** di transaction → lihat event `PetitionCreated`:
  - `usedToken`: true
  - `feePaid`: 0

---

## TEST 4: ❌ Test Token dengan Durasi > 7 Hari (Harus Gagal)

**Menggunakan Account 2**

Sekarang kita test case dimana user punya token tapi pilih durasi > 7 hari.

1. Mint NFT lagi dengan **Account yang berbeda** (misal Account 3) untuk dapat 1 token baru
2. Ganti ke Account 3
3. **Mint Membership** (0.02 ETH) → dapat 1 token
4. Coba buat petition dengan token tapi durasi 14 hari:
   ```
   _title: "Free Education"
   _description: "Education for all"
   _imageHash: "QmT4AeNYvPZRfRxDfz8tYvJxNqw1N3Kj7s9X2pLmH5vQaB"
   _durationInDays: 14
   VALUE: 0
   ```
5. ❌ **Harus GAGAL** dengan error: **"Insufficient fee"**

**Penjelasan**: Token gratis hanya untuk durasi ≤ 7 hari. Untuk durasi lebih lama, wajib bayar ETH!

---

## TEST 5: Buat Petition dengan Durasi Custom (Bayar ETH)

**Menggunakan Account 3** (masih punya 1 token, tapi tidak dipakai)

### Test A: Durasi 14 Hari

1. Hitung fee dulu: `calculateCampaignFee(14)` → `0.0041` ETH
2. Buat petition:
   ```
   _title: "Free Education for All"
   _description: "Education is a human right"
   _imageHash: "QmT4AeNYvPZRfRxDfz8tYvJxNqw1N3Kj7s9X2pLmH5vQaB"
   _durationInDays: 14
   ```
3. **Set VALUE**: `0.0041` Ether
4. Klik **"transact"**
5. ✅ Success!

**Verifikasi:**
- Cek **`getPetition`** → input petition ID → lihat `durationDays`: 14
- Cek **`paidPetitionCount`** → input address Account 3 → harus `1`
- Cek **CampaignToken** `balanceOf` Account 3 → masih `1` (token tidak dipakai)
- Cek **Events** → `usedToken`: false, `feePaid`: 4100000000000000 (0.0041 ETH)

### Test B: Durasi 30 Hari

1. Hitung fee: `calculateCampaignFee(30)` → `0.0089` ETH
2. Buat petition:
   ```
   _title: "Clean Water Initiative"
   _description: "Access to clean water for rural communities"
   _imageHash: "QmP7RdKvY3sN8tHwJxQzVmL9pFgB5rC4aE6nX2mW1sT9qD"
   _durationInDays: 30
   ```
3. **Set VALUE**: `0.0089` Ether
4. ✅ Success!

**Verifikasi:**
- `durationDays`: 30
- `paidPetitionCount` Account 3: 2
- Token balance: masih 1 (tidak terpakai)

### Test C: Durasi 60 Hari

1. Hitung fee: `calculateCampaignFee(60)` → `0.0179` ETH
2. Buat petition:
   ```
   _title: "Renewable Energy Now"
   _description: "Transition to sustainable energy"
   _imageHash: "QmZ9XvLmK4tP2jNwRyHqC5sB8aD7fG3nM6xW1pE9rV4qT"
   _durationInDays: 60
   ```
3. **Set VALUE**: `0.0179` Ether
4. ✅ Success!

**Verifikasi:**
- `durationDays`: 60
- `paidPetitionCount` Account 3: 3

---

## TEST 6: Sign Petition (Public User)

**Menggunakan Account 1** (user biasa, tidak perlu NFT)

1. Ganti account ke **Account 1**
2. Buka contract **PetitionPlatform**
3. Cari function **`signPetition`**
4. Input: `0` (petition ID pertama)
5. **VALUE: 0** (sign petition GRATIS!)
6. Klik **"transact"**
7. ✅ Tunggu transaction success

**Verifikasi:**
- Cek **`hasUserSigned`** → input petitionId `0` dan address Account 1 → harus `true`
- Cek **`getPetition`** → input `0` → lihat `signatureCount` → harus `1`

**Test Multiple Sign:**
1. Ganti ke **Account 2**
2. Sign petition ID `0`
3. Verifikasi `signatureCount` → harus jadi `2`

**Test Sign Duplicate (harus gagal):**
1. Tetap pakai **Account 2**
2. Coba sign petition ID `0` lagi
3. ❌ Harus error: "Already signed"

---

## TEST 7: Reward System (5 Petition Berbayar)

**Menggunakan Account 3** (sudah punya 3 paid petitions)

Buat 2 petition lagi dengan durasi custom untuk mencapai 5 petitions:

**Petition 4 (Durasi 10 hari):**
```
_title: "Animal Rights Protection"
_description: "Stronger laws for animal welfare"
_imageHash: "QmK3LnR8pW7sT5jC2fN9xD4vM6aB1qE8hY7zP3mX9rG5wL"
_durationInDays: 10
VALUE: 0.0029 Ether
```

**Petition 5 (Durasi 7 hari - dapat reward!):**
```
_title: "Digital Privacy Rights"
_description: "Protect user data and privacy"
_imageHash: "QmF8VwT2pL9kN6sR4jH3xC7mD5aB1qE9vY8zP2nX7rG4wK"
_durationInDays: 7
VALUE: 0.002 Ether
```

**Verifikasi Reward:**
1. Cek **`paidPetitionCount`** → input address Account 3 → harus `5`
2. Buka **CampaignToken**
3. Cek **`balanceOf`** → input address Account 3 → harus `2000000000000000000` (2 token!)
   - 1 token dari awal (mint NFT)
   - 1 token reward (5 paid petitions)
4. Cek **Events** di transaction terakhir → harus ada `RewardTokenMinted`

---

## TEST 8: Pakai Token Reward untuk Petition 7 Hari

**Menggunakan Account 3** (punya 2 tokens)

1. Buat petition dengan token (durasi 7 hari):
   ```
   _title: "Ocean Cleanup Initiative"
   _description: "Remove plastic from our oceans"
   _imageHash: "QmL9PwT5jK2nR8sC4fH7xD6vM9aB3qE1hY8zP5mX2rG7wN"
   _durationInDays: 7
   VALUE: 0 (pakai token!)
   ```
2. ✅ Success!

**Verifikasi:**
- Token balance Account 3: `1000000000000000000` (1 token tersisa)
- Petition created dengan `usedToken`: true

---

## TEST 9: ❌ Test Insufficient Payment (Harus Gagal)

**Menggunakan Account 2**

Coba bayar kurang dari required fee:

1. Buat petition durasi 30 hari
2. Required fee: `0.0089` ETH
3. Tapi bayar hanya: `0.005` ETH
4. ❌ **Harus error**: "Insufficient fee"

---

## TEST 10: Update Pricing Config (Owner Only)

**Menggunakan Account 1** (owner)

Test ubah pricing configuration:

1. Ganti ke **Account 1** (owner/deployer)
2. Buka contract **PetitionPlatform**
3. Cari function **`setPricingConfig`**
4. Input parameter:
   ```
   _baseFee: 3000000000000000 (0.003 ETH)
   _baseDurationDays: 7
   _additionalDayFee: 400000000000000 (0.0004 ETH)
   ```
5. Klik **"transact"**
6. ✅ Success!

**Verifikasi:**
- Cek **`getPricingInfo`** → harus show nilai baru
- Test **`calculateCampaignFee(10)`** → harus `0.0042` ETH (0.003 + 3×0.0004)

**Test dengan Non-Owner (Harus Gagal):**
1. Ganti ke **Account 2**
2. Coba panggil `setPricingConfig`
3. ❌ Harus error: "OwnableUnauthorizedAccount"

---

## TEST 11: Close Petition

**Menggunakan Account 2** (creator)

1. Cari function **`closePetition`**
2. Input: `0` (petition ID)
3. Klik **"transact"**

**Verifikasi:**
- Cek **`getPetition`** → input `0` → `isActive`: false

**Test Sign Closed Petition (harus gagal):**
1. Ganti ke **Account 1**
2. Coba sign petition ID `0`
3. ❌ Harus error: "Petition is not active"

---

## TEST 12: Withdraw Platform Fee (Owner Only)

**Menggunakan Account 1** (owner)

1. Ganti account ke **Account 1** (owner)
2. Buka contract **PetitionPlatform**
3. Cari function **`withdraw`**
4. Klik **"transact"**
5. ✅ ETH dari campaign fee akan masuk ke wallet owner

**Verifikasi:**
- Cek balance Account 1 → harus bertambah
- Total fee terkumpul dari semua paid petitions

---

## 📊 Testing Checklist

### Basic Functions:
- ✅ Mint NFT → dapat 1 token gratis
- ✅ Cek pricing info (`getPricingInfo`)
- ✅ Calculate fee untuk berbagai durasi (`calculateCampaignFee`)

### Dynamic Pricing Features:
- ✅ Buat petition dengan token gratis (durasi 7 hari)
- ✅ Buat petition durasi 7 hari dengan ETH (0.002 ETH)
- ✅ Buat petition durasi 10 hari (0.0029 ETH)
- ✅ Buat petition durasi 14 hari (0.0041 ETH)
- ✅ Buat petition durasi 30 hari (0.0089 ETH)
- ✅ Buat petition durasi 60 hari (0.0179 ETH)
- ✅ Test token dengan durasi > 7 hari → error
- ✅ Test insufficient payment → error

### Signing & Voting:
- ✅ Sign petition (1 wallet = 1 sign)
- ✅ Sign duplicate → error
- ✅ Sign closed petition → error

### IPFS Integration:
- ✅ Store IPFS hash di petition
- ✅ Retrieve image hash via `getPetition`
- ✅ View image via IPFS gateway

### Reward System:
- ✅ Setelah 5 petition berbayar → dapat 1 token reward
- ✅ Pakai token reward untuk petition 7 hari gratis
- ✅ Token tidak bisa dipakai untuk durasi > 7 hari

### Access Control & Admin:
- ✅ Non-member tidak bisa buat petition
- ✅ Hanya creator/owner bisa close petition
- ✅ Hanya owner bisa update pricing config
- ✅ Hanya owner bisa update reward threshold
- ✅ Hanya owner bisa withdraw fee

---

## 🖼️ IPFS Integration Guide

### Apa itu IPFS?

**IPFS (InterPlanetary File System)** adalah storage terdesentralisasi untuk menyimpan file (gambar, video, dokumen).

**Kenapa pakai IPFS?**
- ✅ Decentralized (tidak ada single point of failure)
- ✅ Permanent storage (file tidak hilang)
- ✅ Murah gas (hanya simpan hash, bukan file)
- ✅ Industry standard untuk Web3

### Upload Gambar ke Pinata (Manual)

**Step 1: Daftar Pinata**
1. Kunjungi: https://pinata.cloud
2. Sign up (gratis 1GB storage)
3. Verify email

**Step 2: Upload File**
1. Login ke Dashboard
2. Klik **"Upload"** → **"File"**
3. Pilih gambar campaign (PNG/JPG, max 100MB)
4. Klik **"Upload"**

**Step 3: Get IPFS Hash**
1. Setelah upload, lihat list files
2. Copy **CID** (Content Identifier)
   ```
   Contoh: QmYwAPJzv5CZsnAzt8auVZRn5rcYRZHA3dGmXYvNrQ6hE3
   ```
3. Hash ini yang digunakan di smart contract!

**Step 4: Verify Image**
- Buka: `https://ipfs.io/ipfs/[YOUR_HASH]`
- Atau: `https://gateway.pinata.cloud/ipfs/[YOUR_HASH]`
- Gambar harus muncul

### IPFS Hash untuk Testing

Gunakan hash ini untuk testing tanpa upload manual:

```
QmYwAPJzv5CZsnAzt8auVZRn5rcYRZHA3dGmXYvNrQ6hE3
QmT4AeNYvPZRfRxDfz8tYvJxNqw1N3Kj7s9X2pLmH5vQaB
QmP7RdKvY3sN8tHwJxQzVmL9pFgB5rC4aE6nX2mW1sT9qD
QmZ9XvLmK4tP2jNwRyHqC5sB8aD7fG3nM6xW1pE9rV4qT
QmK3LnR8pW7sT5jC2fN9xD4vM6aB1qE8hY7zP3mX9rG5wL
```

---

## 🔧 FAQ & Troubleshooting

### Q: Bagaimana cara hitung biaya untuk durasi tertentu?
**A:** 
- Gunakan function `calculateCampaignFee(durasi)`
- Formula: durasi ≤ 7 hari = 0.002 ETH, lebih dari 7 = 0.002 + ((durasi-7) × 0.0003) ETH
- Contoh: 20 hari = 0.002 + (13 × 0.0003) = 0.0059 ETH

### Q: Kenapa token gratis tidak bisa dipakai untuk durasi 14 hari?
**A:** Token gratis HANYA untuk durasi default (7 hari). Jika mau durasi lebih lama, wajib bayar ETH dengan pricing dinamis.

### Q: Apakah reward token juga berlaku untuk durasi 7 hari saja?
**A:** Ya! Reward token (dari 5 paid petitions) juga hanya bisa dipakai untuk petition 7 hari. Untuk durasi lebih lama, tetap bayar ETH.

### Q: Berapa maksimal durasi petition?
**A:** Maksimal 365 hari (1 tahun). Minimum 1 hari.

### Q: Bisakah pricing diubah setelah deploy?
**A:** Ya! Owner bisa update pricing config dengan function `setPricingConfig()`. Perubahan berlaku untuk petition yang dibuat setelahnya.

### Q: "Insufficient fee" error saat buat petition
**A:** 
- Cek dulu required fee dengan `calculateCampaignFee(durationInDays)`
- Pastikan VALUE yang dikirim >= required fee
- Contoh: durasi 30 hari butuh 0.0089 ETH, tapi kirim cuma 0.005 ETH → error
- Jika punya token tapi durasi > 7 hari → wajib bayar ETH

### Q: Saya punya token tapi tetap kena charge ETH?
**A:** Periksa durasi yang dipilih:
- Durasi ≤ 7 hari + punya token = gratis (token di-burn)
- Durasi > 7 hari meskipun punya token = bayar ETH (token tidak dipakai)

### Q: "Not authorized" error saat mint token
**A:** Pastikan sudah setup connections:
1. `CampaignToken.setPetitionContract(address PetitionPlatform)`
2. `CampaignToken.setDAOMembershipContract(address DAOMembership)` ← PENTING!
3. `DAOMembership.setPetitionContract(address PetitionPlatform)`

### Q: "Not a DAO member" saat buat petition
**A:** Harus mint NFT dulu menggunakan `mintMembership()` dengan 0.02 ETH

### Q: "Already signed" error
**A:** 1 wallet hanya bisa sign 1x per petition. Pakai wallet lain untuk test.

### Q: Token reward tidak masuk setelah 5 petitions
**A:** 
- Reward hanya untuk petition BERBAYAR (pakai ETH, bukan token)
- Cek `paidPetitionCount[address]` → harus kelipatan 5
- Petition dengan token gratis TIDAK dihitung sebagai paid petition

### Q: Bagaimana cara cek berapa petition lagi sampai dapat reward?
**A:** 
```
paidPetitionCount[address] % 5 = sisa petition
Contoh:
- paidPetitionCount = 3 → butuh 2 lagi
- paidPetitionCount = 4 → butuh 1 lagi  
- paidPetitionCount = 5 → dapat reward!
- paidPetitionCount = 8 → butuh 2 lagi untuk reward ke-2
```

### Q: IPFS hash tidak valid?
**A:** 
- Hash harus format: `Qm...` (46-59 karakter)
- Verify hash di: `https://ipfs.io/ipfs/[YOUR_HASH]`
- Pastikan file sudah ter-upload di Pinata

### Q: Gambar tidak muncul saat akses IPFS?
**A:**
- Coba gateway alternatif:
  - `https://ipfs.io/ipfs/[hash]`
  - `https://gateway.pinata.cloud/ipfs/[hash]`
  - `https://cloudflare-ipfs.com/ipfs/[hash]`
- Tunggu beberapa detik (IPFS butuh waktu propagate)
- Pastikan file tidak terhapus dari Pinata

### Q: Apakah bisa update durasi setelah petition dibuat?
**A:** Tidak. Durasi dan deadline bersifat immutable setelah petition dibuat. Hanya bisa close petition lebih awal.

### Q: Petition otomatis expired?
**A:** Ya, setelah deadline lewat, petition tidak bisa di-sign lagi (cek `block.timestamp`)

---

## 📈 Economics & Pricing Examples

### Contoh Kasus Real-World:

**Creator A - Aktivis Lingkungan:**
- Mint NFT: 0.02 ETH → dapat 1 token gratis
- Petition 1 (7 hari, pakai token): FREE
- Petition 2 (14 hari, bayar): 0.0041 ETH
- Petition 3 (30 hari, bayar): 0.0089 ETH
- Petition 4 (60 hari, bayar): 0.0179 ETH
- Petition 5 (7 hari, bayar): 0.002 ETH
- **Total spent**: 0.02 + 0.0041 + 0.0089 + 0.0179 + 0.002 = **0.0529 ETH**
- **Reward**: Dapat 1 token gratis (bisa buat petition 7 hari lagi)

**Creator B - Sering Campaign Pendek:**
- Mint NFT: 0.02 ETH → dapat 1 token gratis
- Petition 1-5 (semua 7 hari): 1 gratis + 4 × 0.002 = 0.008 ETH
- **Total spent**: 0.02 + 0.008 = **0.028 ETH**
- **Reward**: Dapat 1 token (bisa buat 1 lagi gratis)
- Lebih murah karena selalu pilih 7 hari!

**Creator C - Campaign Jangka Panjang:**
- Mint NFT: 0.02 ETH
- Petition 1 (90 hari, bayar): 0.0269 ETH
- Petition 2 (90 hari, bayar): 0.0269 ETH
- **Total spent**: 0.02 + 0.0538 = **0.0738 ETH**
- Lebih mahal tapi durasi 3x lebih lama!

### ROI Analysis:

| Strategi | Petitions | Total Cost | Cost per Petition | Benefit |
|----------|-----------|------------|-------------------|---------|
| 7 hari only | 5 | 0.028 ETH | 0.0056 ETH | + 1 token reward |
| Mixed (7-30 hari) | 5 | 0.0529 ETH | 0.01058 ETH | + 1 token reward |
| Long term (90 hari) | 2 | 0.0738 ETH | 0.0369 ETH | Durasi 13x lebih lama |

---

## 🌐 Frontend Integration

### Calculate & Display Pricing (React Example)

```javascript
import { ethers } from 'ethers';

// Helper function to calculate fee
function calculateDisplayFee(durationDays) {
  const BASE_FEE = 0.002;
  const BASE_DURATION = 7;
  const ADDITIONAL_FEE = 0.0003;
  
  if (durationDays <= BASE_DURATION) {
    return BASE_FEE;
  }
  
  const extraDays = durationDays - BASE_DURATION;
  return BASE_FEE + (extraDays * ADDITIONAL_FEE);
}

// React Component
function CreatePetitionForm() {
  const [duration, setDuration] = useState(7);
  const [hasToken, setHasToken] = useState(false);
  
  // Calculate fee based on duration
  const calculatedFee = calculateDisplayFee(duration);
  const canUseToken = hasToken && duration <= 7;
  const displayFee = canUseToken ? 0 : calculatedFee;
  
  return (
    <div>
      <h2>Create Petition</h2>
      
      {/* Duration Slider */}
      <label>Duration: {duration} days</label>
      <input 
        type="range" 
        min="1" 
        max="365" 
        value={duration}
        onChange={(e) => setDuration(Number(e.target.value))}
      />
      
      {/* Pricing Display */}
      <div className="pricing-info">
        {canUseToken ? (
          <div className="free-badge">
            ✅ FREE (Using Token)
          </div>
        ) : (
          <div className="fee-display">
            💰 Fee: {displayFee.toFixed(4)} ETH
            {hasToken && duration > 7 && (
              <p className="warning">
                ⚠️ Token only works for ≤7 days. 
                For {duration} days, you must pay {displayFee.toFixed(4)} ETH
              </p>
            )}
          </div>
        )}
      </div>
      
      {/* Pricing Breakdown */}
      {duration > 7 && !canUseToken && (
        <div className="breakdown">
          <p>Base (7 days): 0.002 ETH</p>
          <p>Extra days ({duration - 7}): {((duration - 7) * 0.0003).toFixed(4)} ETH</p>
          <hr />
          <p><strong>Total: {calculatedFee.toFixed(4)} ETH</strong></p>
        </div>
      )}
      
      {/* Form fields... */}
    </div>
  );
}
```

### Create Petition with Dynamic Fee

```javascript
async function createPetition(title, description, imageHash, duration) {
  const provider = new ethers.providers.Web3Provider(window.ethereum);
  const signer = provider.getSigner();
  const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
  
  // 1. Check if user has token
  const tokenBalance = await campaignTokenContract.balanceOf(
    await signer.getAddress()
  );
  const hasToken = tokenBalance.gte(ethers.utils.parseEther('1'));
  
  // 2. Calculate required fee
  const requiredFee = await contract.calculateCampaignFee(duration);
  
  // 3. Determine payment method
  let txValue = ethers.BigNumber.from(0);
  
  if (hasToken && duration <= 7) {
    // Can use token for free
    console.log('Using free token');
    txValue = ethers.BigNumber.from(0);
  } else {
    // Must pay with ETH
    console.log(`Paying ${ethers.utils.formatEther(requiredFee)} ETH`);
    txValue = requiredFee;
  }
  
  // 4. Create petition
  try {
    const tx = await contract.createPetition(
      title,
      description,
      imageHash,
      duration,
      { value: txValue }
    );
    
    const receipt = await tx.wait();
    console.log('Petition created!', receipt);
    
    // 5. Check if got reward
    const event = receipt.events?.find(e => e.event === 'RewardTokenMinted');
    if (event) {
      alert('🎉 Congrats! You earned 1 Campaign Token reward!');
    }
    
    return receipt;
  } catch (error) {
    console.error('Error creating petition:', error);
    throw error;
  }
}
```

### Pricing Calculator Component

```javascript
function PricingCalculator() {
  const [duration, setDuration] = useState(7);
  
  const pricing = [
    { days: 7, fee: 0.002, note: 'Base price / Use free token' },
    { days: 14, fee: 0.0041, note: '7 days @ 0.0003 ETH/day' },
    { days: 30, fee: 0.0089, note: '23 days @ 0.0003 ETH/day' },
    { days: 60, fee: 0.0179, note: '53 days @ 0.0003 ETH/day' },
    { days: 90, fee: 0.0269, note: '83 days @ 0.0003 ETH/day' },
  ];
  
  const calculatedFee = calculateDisplayFee(duration);
  
  return (
    <div className="pricing-calculator">
      <h3>Pricing Calculator</h3>
      
      <input 
        type="number" 
        value={duration}
        onChange={(e) => setDuration(Number(e.target.value))}
        min="1"
        max="365"
      />
      
      <div className="result">
        <h4>{duration} days = {calculatedFee.toFixed(4)} ETH</h4>
      </div>
      
      <table>
        <thead>
          <tr>
            <th>Duration</th>
            <th>Fee</th>
            <th>Note</th>
          </tr>
        </thead>
        <tbody>
          {pricing.map(p => (
            <tr key={p.days}>
              <td>{p.days} days</td>
              <td>{p.fee} ETH</td>
              <td>{p.note}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

---

## 📝 Important Notes

### 1. Gas Optimization
- Sign petition gratis (no gas dari user, hanya network fee)
- Calculate fee on-chain lebih akurat (gunakan `calculateCampaignFee`)
- Batch operations bisa save gas (future enhancement)

### 2. Security
- ReentrancyGuard aktif di semua fungsi bayar
- Access control dengan Ownable
- Validasi input di semua function
- Token burn/mint protected dengan authorization

### 3. Scalability
- Pricing config bisa diubah owner: `setPricingConfig()`
- Reward threshold bisa diubah: `setRewardThreshold()`
- Token duration bisa diubah: `setDefaultTokenDuration()`
- Mint price NFT bisa diubah: `setMintPrice()`

### 4. Economics
- Base fee: murah untuk encourage short campaigns
- Additional fee: fair pricing untuk long campaigns
- Reward system: incentivize active creators
- Token utility: real value (bisa hemat biaya)

---

## 🚀 Deployment to Testnet

### Sepolia Testnet Example

1. **Get Sepolia ETH**:
   - https://sepoliafaucet.com
   - https://faucet.quicknode.com/ethereum/sepolia

2. **Deploy Steps**:
   ```
   1. Deploy CampaignToken
   2. Deploy DAOMembership (input CampaignToken address)
   3. Deploy PetitionPlatform (input DAO & Token addresses)
   4. Setup Connections:
      - CampaignToken.setPetitionContract()
      - CampaignToken.setDAOMembershipContract()
      - DAOMembership.setPetitionContract()
   ```

3. **Verify Contracts** on Etherscan:
   - Go to Etherscan Sepolia
   - Find your contract
   - Click "Verify and Publish"
   - Select compiler 0.8.30
   - Paste contract code
   - Add constructor arguments

---

## 🎓 Learning Resources

### Smart Contract Concepts:
- **ERC-721 (NFT)**: Membership system
- **ERC-20 (Token)**: Utility token for free campaigns
- **Dynamic Pricing**: On-chain calculation based on parameters
- **Reward System**: Automated token minting based on activity
- **Access Control**: Ownable pattern for admin functions
- **Reentrancy Protection**: Security best practice

### Web3 Integration:
- **IPFS**: Decentralized image storage
- **Events**: Tracking on-chain activities
- **Gas Optimization**: Efficient storage and calculations
- **Frontend**: React + ethers.js examples

---

## 🔮 Future Enhancements

### Potential Features:
1. **Tiered Pricing**: Discount untuk bulk duration (misal 90 hari lebih murah per hari)
2. **NFT Levels**: Different NFT tiers dengan benefit berbeda
3. **Petition Categories**: Tag dan filter by category
4. **Voting Weight**: NFT holders dapat voting power lebih besar
5. **Deadline Extension**: Creator bisa extend duration dengan bayar tambahan
6. **Analytics Dashboard**: Track petition performance
7. **Social Features**: Comment, share, trending petitions
8. **Multi-sig Close**: Require multiple signatures to close important petitions

---

## 📞 Support & Community

### Debugging Checklist:
- ✅ Compiler version: 0.8.30
- ✅ All contracts compiled without errors
- ✅ Deployment order correct (Token → DAO → Platform)
- ✅ All connections setup (3 function calls)
- ✅ Gas limit sufficient for transactions
- ✅ VALUE set correctly for payable functions

### Common Errors & Solutions:

| Error | Cause | Solution |
|-------|-------|----------|
| "Not authorized" | Connections not setup | Run all setup functions in Step 4 |
| "Not a DAO member" | No NFT | Mint NFT first with mintMembership() |
| "Insufficient fee" | Wrong VALUE | Use calculateCampaignFee() first |
| "Already signed" | Duplicate sign | Each wallet can sign once only |
| "Duration must be 1-365 days" | Invalid duration | Input 1-365 for duration |
| "Token burn failed" | Insufficient token | Check token balance first |

---

## ✅ Final Checklist Before Production

### Smart Contract:
- [ ] All contracts compiled successfully
- [ ] Deployment tested on testnet
- [ ] All functions tested (create, sign, close, withdraw)
- [ ] Pricing calculation verified
- [ ] Reward system working correctly
- [ ] Access control verified (owner functions)
- [ ] Security audit completed (recommended)
- [ ] Contracts verified on Etherscan

### Frontend:
- [ ] Web3 connection working
- [ ] Wallet integration (MetaMask, etc)
- [ ] IPFS upload functional
- [ ] Pricing calculator accurate
- [ ] Transaction feedback (loading, success, error)
- [ ] Mobile responsive design
- [ ] Error handling complete

### Documentation:
- [ ] User guide available
- [ ] API documentation complete
- [ ] FAQ updated
- [ ] Support channels ready

---

**Happy Building! 🚀**

*Platform ini dirancang untuk memberikan transparency, fairness, dan incentive yang tepat untuk ecosystem petition terdesentralisasi. Dengan dynamic pricing, creator bisa flexible memilih durasi campaign sesuai kebutuhan dan budget.*