# Problemas Pendientes

## Consultas N+1

### Resuelto

- **Recaudación por cuota**: cada cuota hacía una consulta individual. Ahora se batea con un dataloader (`apps/api/graph/loaders/recaudacion.loader.go`, registrado en `dataloaders.go`).

### Pendiente

1. **Gastos por cuota (`gastos` en `obtenerCuotas` / `obtenerCuota`)**:
   - Los resolvers `gastos` de `CuotaRegular`, `CuotaEspecial` y `CuotaSemilla` (`apps/api/graph/cuota.resolvers.go`) llaman `resolverObtenerGastos(ctx, r.Resolver, obj.GetID())`.
   - Al consultar la lista de cuotas con `gastos`, se ejecuta una consulta por cuota (N+1).
   - **Fix propuesto**: crear un dataloader `GetGastos(cuotaID)` en `apps/api/graph/loaders/` (análogo a `recaudacion.loader.go`), registrarlo en `dataloaders.go` y usarlo en los tres resolvers.

2. **Auditoría pendiente**:
   - `obtenerDeudas` (`apps/api/graph/obtener_deudas.resolvers.go`): la unidad ya se resuelve vía `loaders.GetUnidad`, pero conviene auditar que el titular y los abonos no hagan consultas por fila.
   - `obtenerGastos` / `obtenerPagos`: revisar que al listar no haya consultas individuales por operación.