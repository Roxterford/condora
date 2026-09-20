import {
  EstadoDeProyecto,
  MetodoDeOperacion,
  Moneda,
  RolDelMovimiento,
  TipoDeCuota,
  TipoDeMovimiento,
} from "../../../generated/prisma/client";
import { prisma } from "../../client";

export async function main() {
  console.log("🌱 Seeding with mock data database...");

  await prisma.destinoDePago.deleteMany();
  await prisma.iTransaccionOperacion.deleteMany();
  await prisma.iTransaccion.deleteMany();
  await prisma.iOperacion.deleteMany();
  await prisma.proyecto.deleteMany();
  await prisma.iDeuda.deleteMany();
  await prisma.cuota.deleteMany();
  await prisma.proveedor.deleteMany();
  await prisma.titularidad.deleteMany();
  await prisma.unidad.deleteMany();
  await prisma.sujeto.deleteMany();
  await prisma.usuario.deleteMany();

  await prisma.sujeto.createMany({
      data: [
        {
          id: "juan",
          tipo: "PERSONA_NATURAL",
          documento_identidad: "V-12345678",
          nombres: "Juan Andres",
          apellidos: "Ramirez Rodriguez",
          email: "juan@email.com",
          telefono: "+584123456789",
        },
        {
          id: "roxterford",
          tipo: "ENTE_JURIDICO",
          documento_identidad: "J-12345678",
          razon_social: "Roxterford",
          email: "roxter@roxterford.com",
          telefono: "+584123456789",
        },
        {
          id: "santiago",
          tipo: "PERSONA_NATURAL",
          documento_identidad: "V-12345679",
          nombres: "Santiago Mariño",
          apellidos: "Mariño Rodriguez",
          email: "santiago@email.com",
          telefono: "+584128888888",
        },
      ],
    });

    await prisma.sujeto.update({
      where: { id: "roxterford" }, data: {
        representante: "santiago"
      }
    })

    await prisma.unidad.createMany({
      data: Array(500)
        .fill(null)
        .map((_, i) => ({
          id: "u" + (i + 1).toString(),
          codigo: "villa-" + (i + 1).toString(),
          estado: "ACTIVA",
        })),
    });

    await prisma.titularidad.createMany({
      data: [
        {
          titular: "juan",
          unidad: "u1",
        },
        {
          titular: "roxterford",
          unidad: "u2",
        },
        {
          titular: "roxterford",
          unidad: "u3",
        },
        {
          titular: "roxterford",
          unidad: "u4",
        },
      ],
    });

    await prisma.unidad.update({ where: { id: "u1" }, data: { contacto: "juan", titular_primario: "juan" } })
    await prisma.unidad.updateMany({ where: { id: { in: ["u2", "u3", "u4"] } }, data: { contacto: "santiago", titular_primario: "roxterford" } })

    await prisma.usuario.create({
      data: {
        id: "tester",
        email: "tester@example.com",
        password:
          "$2a$12$TWaUL3tJEuMNUfC7uiiAjelPshhEWyBePLxVzs34LWdi1TnpJN0ZO", // password
      },
    });

    const proveedores = await prisma.proveedor.createManyAndReturn({
      data: [
        {
          id: "pvdr0",
          nombre: "Proveedor 0",
          rif: "J-123456789",
          email: "proveedor0@example.com",
          telefono: "04121234567",
          direccion: "Av. Principal, Edif. Comercial, Local 0",
        },
        {
          id: "pvdr1",
          nombre: "Servicios de Limpieza RZ",
          rif: "J-111111111",
          email: "contacto@limpiezaz.com",
          telefono: "04121111111",
          direccion: "Calle 1, Local 1",
        },
        {
          id: "pvdr2",
          nombre: "Ascensores Seguros C.A.",
          rif: "J-222222222",
          email: "servicio@ascensores.com",
          telefono: "04122222222",
          direccion: "Av. Libertador, Torre B",
        },
        {
          id: "pvdr3",
          nombre: "Vigilancia Total 24h",
          rif: "J-333333333",
          email: "ventas@vigilancia24.com",
          telefono: "04123333333",
          direccion: "Urb. Las Flores, Qta. 3",
        },
        {
          id: "pvdr4",
          nombre: "Electricidad Comunal",
          rif: "J-444444444",
          email: "facturacion@electrica.com",
          telefono: "04124444444",
          direccion: "Planta Baja, Local 4",
        },
        {
          id: "pvdr5",
          nombre: "Agua Potable y Mantenimiento",
          rif: "J-555555555",
          email: "agua@mantenimiento.com",
          telefono: "04125555555",
          direccion: "Calle 5, Sector Norte",
        },
        {
          id: "pvdr6",
          nombre: "Jardines y Paisajismo Verde",
          rif: "J-666666666",
          email: "hola@jardinesverde.com",
          telefono: "04126666666",
          direccion: "Av. Los Pinos, Local 6",
        },
        {
          id: "pvdr7",
          nombre: "Control de Plagas Profesional",
          rif: "J-777777777",
          email: "fumiga@controlplagas.com",
          telefono: "04127777777",
          direccion: "Calle 7, Edif. San José",
        },
        {
          id: "pvdr8",
          nombre: "Piscinas y Recreación",
          rif: "J-888888888",
          email: "piscina@recreacion.com",
          telefono: "04128888888",
          direccion: "Urb. El Lago, Piso 2",
        },
        {
          id: "pvdr9",
          nombre: "Seguros Condominales",
          rif: "J-999999999",
          email: "polizas@seguros.com",
          telefono: "04129999999",
          direccion: "Av. Principal, Torre C",
        },
      ],
    });

    const conceptosGasto = [
      "Limpieza",
      "Limpieza de áreas comunes",
      "Mantenimiento de ascensores",
      "Vigilancia y seguridad",
      "Pago de servicio eléctrico",
      "Pago de servicio de agua",
      "Mantenimiento de jardines",
      "Fumigación y control de plagas",
      "Mantenimiento de piscina",
      "Reparación de portón principal",
      "Pintura de fachada",
      "Honorarios de administración",
      "Póliza de seguro del edificio",
      "Internet comunitario",
      "Mantenimiento de bomba de agua",
      "Reparación de tuberías",
      "Cambio de luminarias comunes",
      "Mantenimiento de sistema CCTV",
      "Servicio de gas comunitario",
      "Recarga de extintores",
    ];

    const montosGasto = [8_75, 12_00, 25_00, 35_50, 40_00, 55_25, 60_00, 75_75, 90_00, 120_50];
    const tasasGasto = [12_50, 25_00, 40_00, 55_75, 100_00, 150_25, 200_00, 250_50, 300_00, 325_38];
    const metodosGasto = [
      MetodoDeOperacion.EFECTIVO,
      MetodoDeOperacion.TRANSFERENCIA_NACIONAL,
      MetodoDeOperacion.PAGO_MOVIL,
      MetodoDeOperacion.CHEQUE,
    ];

    for (let i = 0; i < 120; i++) {
      await prisma.iOperacion.create({
        data: {
          id: "g" + i.toString(),
          concepto: conceptosGasto[i % conceptosGasto.length]!,
          monto: montosGasto[i % montosGasto.length]!,
          moneda: i % 5 === 0 ? Moneda.USD : Moneda.VED,
          metodo: metodosGasto[i % metodosGasto.length]!,
          tasa: tasasGasto[i % tasasGasto.length]!,
          tipo: TipoDeMovimiento.DEBITO,
          rol: RolDelMovimiento.PROVEEDOR,
          proveedor: proveedores[i % proveedores.length]!.id,
          registrado_por: "tester",
        },
      });
    }

    const cuotas = await prisma.cuota.createManyAndReturn({
      data: [
        {
          id: "c0",
          monto: 8_75,
          mes: 1,
          anio: 2026,
          tipo: TipoDeCuota.REGULAR,
          registrado_por: "tester",
          actualizado_por: "tester",
        },
        {
          id: "c1",
          monto: 9_22,
          mes: 2,
          anio: 2026,
          tipo: TipoDeCuota.REGULAR,
          registrado_por: "tester",
          actualizado_por: "tester",
        },
        {
          id: "c3",
          monto: 8_94,
          mes: 3,
          anio: 2026,
          tipo: TipoDeCuota.ESPECIAL,
          registrado_por: "tester",
          actualizado_por: "tester",
        },

        {
          id: "c4",
          monto: 8_75,
          mes: 4,
          anio: 2026,
          tipo: TipoDeCuota.ESPECIAL,
          registrado_por: "tester",
          actualizado_por: "tester",
        },
      ],
    });

    await prisma.proyecto.createMany({
      data: cuotas
        .filter((cuota) => cuota.tipo === TipoDeCuota.ESPECIAL)
        .map((cuota) => ({
          titulo: `Proyecto para cuota ${cuota.id}`,
          cuota: cuota.id,
          descripcion: `Proyecto para cuota ${cuota.id}`,
          registrado_por: "tester",
          estado: EstadoDeProyecto.ACTIVO,
          actualizado_por: "tester",
          justificacion: `Proyecto para cuota ${cuota.id}`,
          fecha_limite: new Date(cuota.anio, cuota.mes - 1, 1),
        })),
    });

    for (const [i, c] of cuotas.entries()) {
      await prisma.iDeuda.createMany({
        data: Array(500)
          .fill(null)
          .map((_, v) => {
            // console.log(`d${i + v + 1}[${c.id}]v[${v + 1}]`);
            return {
              id: `d${i + v + 1}[${c.id}]v[${v + 1}]`,
              unidad: "villa-" + (v + 1).toString(),
              cuota: c.id,
              monto: 123
            };
          }),
      });
    }

    const pagoOperacion = await prisma.iOperacion.create({
      data: {
        id: "mp0",
        concepto: "Pago de prueba",
        monto: 8134_50,
        moneda: Moneda.VED,
        metodo: MetodoDeOperacion.EFECTIVO,
        tasa: 325_38,
        tipo: TipoDeMovimiento.CREDITO,
        rol: RolDelMovimiento.UNIDAD,
        unidad_codigo: "villa-500",
        registrado_por: "tester",
      },
    });

    await prisma.destinoDePago.create({
      data: { deuda: "d500[c0]v[500]", operacion: pagoOperacion.id, destinado: 8_75 },
    });

    console.log("✅ Seeding completed.");
}

