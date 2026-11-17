/** Tarjeta de la clase próxima / en curso con cuenta regresiva (RF-05). */
import { StyleSheet, Text, View } from 'react-native';
import type { ReactElement } from 'react';
import { desglosarCuenta, textoCuenta } from '../logica/tiempo';
import type { ClaseProxima } from '../logica/proxima-clase';

type Props = {
  enCurso: (ClaseProxima & { termina: Date }) | null;
  proxima: ClaseProxima | null;
  ahora: Date;
};

export function TarjetaClase({ enCurso, proxima, ahora }: Props): ReactElement | null {
  if (enCurso) {
    return (
      <View style={[styles.tarjeta, styles.azul]} accessibilityRole="header">
        <Text style={styles.etiqueta}>En curso ahora</Text>
        <Text style={styles.materia}>{enCurso.materia.nombre}</Text>
        <Text style={styles.detalle}>
          {enCurso.bloque.hora_inicio} – {enCurso.bloque.hora_fin}
          {enCurso.materia.salon ? ` · Salón ${enCurso.materia.salon}` : ''}
        </Text>
        <Text style={styles.cuenta}>
          Termina en{' '}
          {textoCuenta(desglosarCuenta(enCurso.termina.getTime() - ahora.getTime()))}
        </Text>
      </View>
    );
  }
  if (!proxima) return null;
  return (
    <View style={[styles.tarjeta, styles.azul]} accessibilityRole="header">
      <Text style={styles.etiqueta}>Próxima clase</Text>
      <Text style={styles.materia}>{proxima.materia.nombre}</Text>
      <Text style={styles.detalle}>
        {diaNombre(proxima.bloque.dia)} {proxima.bloque.hora_inicio}
        {proxima.materia.salon ? ` · Salón ${proxima.materia.salon}` : ''}
      </Text>
      <Text style={styles.cuenta}>
        Empieza en{' '}
        {textoCuenta(desglosarCuenta(proxima.empieza.getTime() - ahora.getTime()))}
      </Text>
    </View>
  );
}

function diaNombre(dia: number): string {
  const nombres = [
    'lunes',
    'martes',
    'miércoles',
    'jueves',
    'viernes',
    'sábado',
    'domingo',
  ];
  return nombres[dia - 1] ?? '';
}

const styles = StyleSheet.create({
  tarjeta: { borderRadius: 14, padding: 16, gap: 4 },
  azul: { backgroundColor: '#2563eb' },
  etiqueta: { color: '#dbeafe', fontSize: 13, fontWeight: '700' },
  materia: { color: '#fff', fontSize: 22, fontWeight: '800' },
  detalle: { color: '#eff6ff', fontSize: 15 },
  cuenta: { color: '#fff', fontSize: 15, fontWeight: '700', marginTop: 4 },
});
