# 🗳️ DAO Petition Platform - Complete Guide

Platform voting terdesentralisasi untuk petition/campaign dengan sistem reward berbasis aktivitas.

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
   - Bisa buat petition dengan:
     - Campaign Token (gratis) ATAU
     - Bayar 0.01 ETH per petition
   - Setiap 5 petition berbayar → dapat 1 Campaign Token reward

### Smart Contracts:
- **CampaignToken.sol**: ERC-20 token untuk bikin petition gratis
- **DAOMembership.sol**: ERC-721 NFT membership
- **PetitionPlatform.sol**: Core logic voting & petition

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
Copy paste code dari artifact PetitionPlatform.sol

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

#### 4A. Setup CampaignToken

1. Klik contract **CampaignToken** di "Deployed Contracts"
2. Cari function **`setPetitionContract`**
3. Input address **PetitionPlatform** dari Step 3
   ```
   _petitionContract: 0x4B20993Bc481177ec7E8f571ceCaE8A9e22C02db
   ```
4. Klik **"transact"**
5. ✅ Tunggu sampai transaction success

#### 4B. Setup DAOMembership

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

## TEST 2: Buat Petition Pertama (Pakai Token Gratis)

**Menggunakan Account 2** (yang sudah punya NFT)

1. Pastikan masih pakai **Account 2**
2. Buka contract **PetitionPlatform**
3. Cari function **`createPetition`**
4. Input parameter:
   ```
   _title: "Stop Deforestation"
   _description: "We need to protect our forests for future generations"
   _durationInDays: 30
   ```
5. **VALUE: 0** (karena pakai token gratis, tidak perlu ETH)
6. Klik **"transact"**
7. ✅ Tunggu transaction success

**Verifikasi:**
- Cek function **`petitionCounter`** → harus return `1`
- Cek function **`getPetition`** → input `0` → lihat detail petition
- Buka **CampaignToken** → cek `balanceOf` Account 2 → harus `0` (token sudah di-burn)

---

## TEST 3: Buat Petition Kedua (Bayar dengan ETH)

**Menggunakan Account 2**

1. Cari function **`createPetition`** lagi
2. Input parameter:
   ```
   _title: "Free Education for All"
   _description: "Education is a human right and should be accessible to everyone"
   _durationInDays: 45
   ```
3. **Set VALUE**: `0.01` Ether (WAJIB bayar karena token sudah habis)
4. Klik **"transact"**
5. ✅ Tunggu transaction success

**Verifikasi:**
- Cek **`petitionCounter`** → harus `2`
- Cek **`paidPetitionCount`** → input address Account 2 → harus `1`
- Cek **`getPetition`** → input `1` → lihat detail petition kedua

---

## TEST 4: Sign Petition (Public User)

**Menggunakan Account 3** (user biasa, tidak perlu NFT)

1. Ganti account ke **Account 3**
2. Buka contract **PetitionPlatform**
3. Cari function **`signPetition`**
4. Input: `0` (petition ID pertama)
5. **VALUE: 0** (sign petition GRATIS!)
6. Klik **"transact"**
7. ✅ Tunggu transaction success

**Verifikasi:**
- Cek **`hasUserSigned`** → input petitionId `0` dan address Account 3 → harus `true`
- Cek **`getPetition`** → input `0` → lihat `signatureCount` → harus `1`

**Test Multiple Sign:**
1. Ganti ke **Account 2** (creator)
2. Sign petition ID `0`
3. Verifikasi `signatureCount` → harus jadi `2`

**Test Sign Duplicate (harus gagal):**
1. Tetap pakai **Account 2**
2. Coba sign petition ID `0` lagi
3. ❌ Harus error: "Already signed"

---

## TEST 5: Reward System (5 Petition Berbayar)

**Menggunakan Account 2**

Buat 3 petition lagi dengan bayar ETH (total jadi 4 petition berbayar):

**Petition 3:**
```
_title: "Clean Water Initiative"
_description: "Access to clean water for rural communities"
_durationInDays: 60
VALUE: 0.01 Ether
```

**Petition 4:**
```
_title: "Renewable Energy Now"
_description: "Transition to sustainable energy sources"
_durationInDays: 90
VALUE: 0.01 Ether
```

**Petition 5 (Yang ke-5, dapat reward!):**
```
_title: "Animal Rights Protection"
_description: "Stronger laws to protect animal welfare"
_durationInDays: 30
VALUE: 0.01 Ether
```

**Verifikasi Reward:**
1. Cek **`paidPetitionCount`** → input address Account 2 → harus `5`
2. Buka **CampaignToken**
3. Cek **`balanceOf`** → input address Account 2 → harus `1000000000000000000` (1 token reward!)

---

## TEST 6: Pakai Token Reward untuk Petition Gratis

**Menggunakan Account 2**

1. Buat petition baru:
   ```
   _title: "Digital Privacy Rights"
   _description: "Protect user data and privacy online"
   _durationInDays: 60
   VALUE: 0 (pakai token, tidak perlu ETH!)
   ```
2. Klik **"transact"**

**Verifikasi:**
- Token di **CampaignToken** → `balanceOf` Account 2 → harus `0` (token di-burn)
- Petition berhasil dibuat tanpa bayar ETH!

---

## TEST 7: Close Petition (Creator atau Owner)

**Menggunakan Account 2** (creator petition)

1. Cari function **`closePetition`**
2. Input: `0` (petition ID yang mau ditutup)
3. Klik **"transact"**

**Verifikasi:**
- Cek **`getPetition`** → input `0` → lihat `isActive` → harus `false`

**Test Sign Closed Petition (harus gagal):**
1. Ganti ke **Account 3**
2. Coba sign petition ID `0`
3. ❌ Harus error: "Petition is not active"

---

## TEST 8: Withdraw Platform Fee (Owner Only)

**Menggunakan Account 1** (owner/deployer)

1. Ganti account ke **Account 1** (owner)
2. Buka contract **PetitionPlatform**
3. Cari function **`withdraw`**
4. Klik **"transact"**
5. ✅ ETH dari campaign fee akan masuk ke wallet owner

**Verifikasi:**
- Cek balance Account 1 → harus bertambah
- Total fee yang masuk = jumlah petition berbayar × 0.01 ETH

---

## 📊 Testing Checklist

**Basic Functions:**
- ✅ Mint NFT → dapat 1 token gratis
- ✅ Buat petition dengan token gratis
- ✅ Buat petition dengan bayar ETH
- ✅ Sign petition (1 wallet = 1 sign)
- ✅ Sign duplicate → error
- ✅ Sign closed petition → error

**Reward System:**
- ✅ Setelah 5 petition berbayar → dapat 1 token reward
- ✅ Pakai token reward untuk petition gratis

**Access Control:**
- ✅ Non-member tidak bisa buat petition
- ✅ Siapa saja bisa sign petition (gratis)
- ✅ Hanya creator/owner bisa close petition
- ✅ Hanya owner bisa withdraw fee

**Edge Cases:**
- ✅ Mint NFT 2x dengan wallet sama → error
- ✅ Buat petition tanpa NFT → error
- ✅ Buat petition tanpa token & tanpa ETH → error
- ✅ Sign expired petition → error

---

## 🔧 FAQ & Troubleshooting

### Q: "Not authorized" error saat mint token
**A:** Pastikan sudah panggil `setPetitionContract()` di CampaignToken dan DAOMembership

### Q: "Not a DAO member" saat buat petition
**A:** Harus mint NFT dulu menggunakan `mintMembership()` dengan 0.02 ETH

### Q: "Insufficient fee" saat buat petition
**A:** 
- Cek balance Campaign Token dulu
- Kalau tidak punya token, wajib bayar 0.01 ETH
- Set VALUE di Remix sebelum transact

### Q: "Already signed" error
**A:** 1 wallet hanya bisa sign 1x per petition. Pakai wallet lain untuk test.

### Q: Token reward tidak masuk
**A:** Reward hanya diberikan setiap 5 petition BERBAYAR (yang pakai ETH, bukan token)

### Q: Bagaimana cara cek berapa petition lagi sampai dapat reward?
**A:** 
```
paidPetitionCount[address] % 5 = sisa petition
Contoh:
- paidPetitionCount = 3 → butuh 2 lagi
- paidPetitionCount = 4 → butuh 1 lagi
- paidPetitionCount = 5 → dapat reward!
```

### Q: Petition otomatis expired?
**A:** Ya, setelah deadline lewat, petition tidak bisa di-sign lagi (cek `block.timestamp`)

---

## 📝 Important Notes

1. **Gas Optimization**: 
   - Sign petition gratis (no gas dari user, hanya network fee)
   - Campaign Token non-transferable (opsional, bisa diubah)

2. **Security**:
   - ReentrancyGuard aktif di semua fungsi bayar
   - Access control dengan Ownable
   - Validasi input di semua function

3. **Scalability**:
   - Reward threshold bisa diubah owner: `setRewardThreshold()`
   - Campaign fee bisa diubah owner: `setCampaignFee()`
   - Mint price NFT bisa diubah owner: `setMintPrice()`

---

## 🚀 Next Steps (After Testing)

1. **Deploy to Testnet** (Sepolia/Goerli):
   - Ganti network di Remix
   - Connect MetaMask
   - Deploy dengan urutan sama
   - Verify contract di Etherscan

2. **Frontend Integration**:
   - Connect dengan Web3.js/Ethers.js
   - Buat UI untuk create & sign petition
   - Display petition list & detail

3. **Enhancements**:
   - Add IPFS untuk store petition data
   - Add voting deadline notification
   - Add petition categories/tags
   - Add search & filter function

---

## 📞 Support

Jika ada error atau pertanyaan saat testing, cek:
1. Console log di Remix
2. Transaction error message
3. Pastikan semua setup connections sudah benar
4. Pastikan compile dengan Solidity 0.8.30

**Happy Testing! 🎉**