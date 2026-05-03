import React from 'react'
import { useContext } from 'react'
import { AuthContext } from '../App'

export default function LoginModal() {
  const { login } = useContext(AuthContext)
  return null // Inline in Profile
}