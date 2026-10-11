export function getUserScope() {
  try {
    const user = JSON.parse(localStorage.getItem('velox_user') || 'null')
    if (user?.id !== undefined && user?.id !== null) return String(user.id)
  } catch (error) {
    console.error('Foydalanuvchi ma’lumotlarini o‘qishda xato:', error)
  }
  return 'guest'
}
