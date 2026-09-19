import React from 'react';
import { Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, type } from '@/theme';

export function NoAccess() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 10 }}>
      <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: colors.dangerSoft, alignItems: 'center', justifyContent: 'center' }}>
        <Feather name="lock" size={26} color={colors.danger} />
      </View>
      <Text style={type.title}>Không có quyền truy cập</Text>
      <Text style={[type.bodySm, { textAlign: 'center' }]}>Chỉ Quản Trị Viên mới xem được màn hình này.</Text>
    </View>
  );
}
