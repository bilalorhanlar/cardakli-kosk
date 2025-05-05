import jwt from 'jsonwebtoken'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const { username, password } = req.body

  // Burada gerçek bir veritabanı kullanılmalı
  // Şimdilik sabit kullanıcı adı ve şifre kullanıyoruz
  const validUsername = process.env.ADMIN_USERNAME
  const validPassword = process.env.ADMIN_PASSWORD

  if (username === validUsername && password === validPassword) {
    // JWT token oluştur
    const token = jwt.sign(
      { username },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    )

    return res.status(200).json({ token })
  }

  return res.status(401).json({ message: 'Geçersiz kullanıcı adı veya şifre' })
} 