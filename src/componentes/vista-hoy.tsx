/** Vista de la pantalla «Hoy» (presentacional, accesible). */
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { ReactElement } from 'react';
import { BannerSalYa } from './banner-sal-ya';
import { EstadoCarga } from './estado-carga';
import { TarjetaClase } from './tarjeta-clase';
import { useDistanciaCampus, useReloj, type DatosHoy } from '../hooks/use-pantalla-hoy';
import { leerAjustes } from '../repositorios/ajustes';

type Props = DatosHoy & { sensorDisponible: boolean };

export function VistaHoy({
  estado,
  vista,
  avisoSincro,
  recargar,
  hablarProxima,
  sensorDisponible,
}: Props): ReactElement {
  const { distancia, verificar } = useDistanciaCampus();
  const ahora = useReloj();
  const ajustes = leerAjustes();
  const hayClasePendiente = !!vista?.proxima || !!vista?.enCurso;

  if (estado !== 'listo' || !vista) {
    return <EstadoCarga estado={estado} alReintentar={recargar} />;
  }

  return (
    <ScrollView contentContainerStyle={styles.base}>
      <TarjetaClase enCurso={vista.enCurso} proxima={vista.proxima} ahora={ahora} />
      <BannerSalYa
        distanciaMetros={distancia}
        minutosAviso={ajustes.minutos_aviso}
        campusConfigurado={ajustes.campus_lat !== null}
        hayClasePendiente={hayClasePendiente}
      />
      <FilaBotones
        verificar={verificar}
        hablarProxima={hablarProxima}
        sensorDisponible={sensorDisponible}
      />
      <Text style={styles.seccion}>Clases de hoy</Text>
      <ListaHoy
        clases={vista.deHoy.map((c) => ({
          id: c.bloque.id,
          nombre: c.materia.nombre,
          color: c.materia.color,
          inicio: c.bloque.hora_inicio,
          fin: c.bloque.hora_fin,
        }))}
      />
      {avisoSincro ? <Text style={styles.sincro}>{avisoSincro}</Text> : null}
    </ScrollView>
  );
}

function FilaBotones({
  verificar,
  hablarProxima,
  sensorDisponible,
}: {
  verificar: () => Promise<void>;
  hablarProxima: () => void;
  sensorDisponible: boolean;
}): ReactElement {
  return (
    <View style={styles.fila}>
      <Pressable
        style={styles.boton}
        onPress={() => void verificar()}
        accessibilityRole="button"
        accessibilityLabel="Verificar distancia al campus"
      >
        <Text style={styles.botonTexto}>Verificar distancia</Text>
      </Pressable>
      <Pressable
        style={[styles.boton, styles.secundario]}
        onPress={hablarProxima}
        accessibilityRole="button"
        accessibilityLabel="Leer la próxima clase en voz alta"
      >
        <Text style={styles.botonTextoOscuro}>
          {sensorDisponible ? '🔊 También con sacudida' : '🔊 Leer en voz alta'}
        </Text>
      </Pressable>
    </View>
  );
}

function ListaHoy({
  clases,
}: {
  clases: { id: string; nombre: string; color: string; inicio: string; fin: string }[];
}): ReactElement | null {
  if (clases.length === 0) {
    return <Text style={styles.vacio}>Hoy no tienes clases. ¡Buen descanso!</Text>;
  }
  return (
    <View style={styles.lista}>
      {clases.map((clase) => (
        <View
          key={clase.id}
          style={styles.filaClase}
          accessibilityLabel={`${clase.nombre} de ${clase.inicio} a ${clase.fin}`}
        >
          <View style={[styles.punto, { backgroundColor: clase.color }]} />
          <Text style={styles.nombre}>{clase.nombre}</Text>
          <Text style={styles.horas}>
            {clase.inicio}–{clase.fin}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  base: { padding: 16, gap: 12 },
  fila: { flexDirection: 'row', gap: 8 },
  boton: {
    backgroundColor: '#2563eb',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    minHeight: 44,
    justifyContent: 'center',
    flex: 1,
  },
  secundario: { backgroundColor: '#e5e7eb' },
  botonTexto: { color: '#fff', fontWeight: '700', textAlign: 'center' },
  botonTextoOscuro: { color: '#1f2937', fontWeight: '700', textAlign: 'center' },
  seccion: { fontSize: 17, fontWeight: '800', marginTop: 8 },
  vacio: { color: '#586272', textAlign: 'center', padding: 12 },
  lista: { gap: 8 },
  filaClase: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#f1f3f6',
    borderRadius: 10,
    padding: 12,
  },
  punto: { width: 12, height: 12, borderRadius: 6 },
  nombre: { fontWeight: '700', flex: 1 },
  horas: { color: '#586272' },
  sincro: { color: '#586272', textAlign: 'center', fontSize: 12 },
});
