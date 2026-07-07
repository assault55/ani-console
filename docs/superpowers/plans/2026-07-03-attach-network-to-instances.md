# Attach Network To Instances Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow users to select VPC/subnet when creating container, GPU container, sandbox, and VM instances, and make the real Kubernetes/KubeVirt workload attach to the selected Kube-OVN subnet.

**Architecture:** Treat Console network selection as product intent (`vpc_id`, `subnet_id`, optional `private_ip`) and let the backend translate IDs to provider names. For Kubernetes-backed container workloads, apply Kube-OVN pod annotations; for KubeVirt VMs, apply the same network placement to the VMI/launcher pod path used by the provider. Store and expose the selected network fields on instance records so Console can show what was attached.

**Tech Stack:** OpenAPI `openapi/v1.yaml`, Console React/Arco, generated `frontends/console/src/api/core-schema.d.ts`, backend Core service/provider code in the Core repository, Kubernetes, KubeVirt, Kube-OVN.

## Global Constraints

- Do not expose raw Kube-OVN object names in Console forms; users select ANI `vpc_id` / `subnet_id`.
- Do not let Console write provider annotations directly.
- Require `subnet_id` for real network attachment; derive VPC from subnet and validate it matches selected `vpc_id`.
- `private_ip` is optional; if omitted, Kube-OVN allocates one from the subnet.
- Keep old instance creation compatible by allowing omitted network fields until the backend is ready to make them required.
- Update development records after verified code changes.
- Do not edit frozen product spec documents.

---

### Task 1: Extend API Contract For Instance Network Intent

**Files:**
- Modify: `openapi/v1.yaml`
- Regenerate: `frontends/console/src/api/core-schema.d.ts`
- Test: backend OpenAPI/schema validation in Core repo; Console typecheck in this repo

**Interfaces:**
- Produces `CreateInstanceNetworkConfig`:
  - `vpc_id?: string`
  - `subnet_id?: string`
  - `private_ip?: string | null`
  - `security_group_ids?: string[]`
- Adds `network?: CreateInstanceNetworkConfig` to `CreateInstanceRequest`.
- Adds instance response fields:
  - `vpc_id?: string | null`
  - `subnet_id?: string | null`
  - `private_ip?: string | null`

- [ ] Add OpenAPI schema:

```yaml
    CreateInstanceNetworkConfig:
      type: object
      description: "Instance network placement intent. Backend resolves IDs to provider resources."
      properties:
        vpc_id:       { type: string, nullable: true }
        subnet_id:    { type: string, nullable: true }
        private_ip:   { type: string, nullable: true, description: "Optional fixed IPv4 inside subnet CIDR." }
        security_group_ids:
          type: array
          items: { type: string }
          default: []
```

- [ ] Add to `CreateInstanceRequest.properties`:

```yaml
        network:
          $ref: '#/components/schemas/CreateInstanceNetworkConfig'
```

- [ ] Add nullable network fields to `InstanceRecord.properties`:

```yaml
        vpc_id:      { type: string, nullable: true }
        subnet_id:   { type: string, nullable: true }
        private_ip:  { type: string, nullable: true }
```

- [ ] Regenerate Console schema:

```bash
cd frontends/console
npm run codegen
npm run typecheck
```

Expected: `core-schema.d.ts` includes `CreateInstanceNetworkConfig` and `CreateInstanceRequest.network`.

---

### Task 2: Persist And Validate Instance Network Intent In Backend

**Files:**
- Modify in Core backend repository: instance create request DTO/model
- Modify in Core backend repository: `workload_instances` persistence/migration
- Modify in Core backend repository: instance create service
- Test in Core backend repository: unit tests for validation

**Interfaces:**
- Consumes `network` from `CreateInstanceRequest`.
- Produces stored instance fields: `vpc_id`, `subnet_id`, `private_ip`.
- Uses existing `network_vpcs` and `network_subnets` tables.

- [ ] Add DB migration:

```sql
ALTER TABLE workload_instances ADD COLUMN vpc_id text NULL;
ALTER TABLE workload_instances ADD COLUMN subnet_id text NULL;
ALTER TABLE workload_instances ADD COLUMN private_ip text NULL;
```

- [ ] Add validation test:

```text
create instance with subnet_id that does not exist -> 400
create instance with subnet_id from another vpc_id -> 400
create instance with private_ip outside subnet CIDR -> 400
create instance with valid vpc_id/subnet_id/private_ip -> accepted
```

- [ ] Implement validation:
  - load subnet by `(tenant_id, subnet_id)`
  - load VPC by `(tenant_id, subnet.vpc_id)`
  - if request has `vpc_id`, require `request.vpc_id == subnet.vpc_id`
  - require subnet state `available`
  - require VPC state `available`
  - if `private_ip` is set, validate it is inside subnet CIDR and not equal gateway

- [ ] Store fields on the instance record and include them in list/detail responses.

---

### Task 3: Translate ANI Subnet To Kube-OVN Provider Annotation

**Files:**
- Modify in Core backend repository: Kubernetes workload provider for containers/sandbox
- Modify in Core backend repository: KubeVirt VM provider
- Test in Core backend repository: provider manifest/unit tests

**Interfaces:**
- Consumes stored `subnet_id`, `private_ip`.
- Resolves provider subnet name using existing naming convention:
  - ANI subnet ID `subnet_xxx`
  - Kube-OVN subnet CR name `subnet-subnet-xxx`
- Produces workload annotations:

```yaml
ovn.kubernetes.io/logical_switch: subnet-subnet-xxx
ovn.kubernetes.io/ip_address: 10.72.0.10
```

- [ ] Add provider test for container Pod manifest:

```text
given instance.network.subnet_id=subnet_abc and private_ip=10.72.0.10
expect Pod metadata.annotations["ovn.kubernetes.io/logical_switch"] == "subnet-subnet-abc"
expect Pod metadata.annotations["ovn.kubernetes.io/ip_address"] == "10.72.0.10"
```

- [ ] Implement container/sandbox Pod annotation injection.

- [ ] Add provider test for VM/KubeVirt manifest:

```text
given VM instance network subnet_id=subnet_abc
expect the generated KubeVirt object path used by this provider carries Kube-OVN subnet placement
```

- [ ] Implement VM path according to the existing provider model:
  - if VM provider creates a launcher Pod template, attach annotations there
  - if it creates `VirtualMachine` only, attach annotations in the supported KubeVirt template metadata path

- [ ] Keep annotation generation backend-only; do not add annotation fields to OpenAPI.

---

### Task 4: Add Console Network Selection To Instance Creation

**Files:**
- Modify: `frontends/console/src/routes/_authenticated/instances/index.tsx`
- Reuse: `frontends/console/src/components/forms/Ipv4CidrInput.tsx`
- Reuse: `frontends/console/src/lib/validators.ts`
- Modify: `frontends/console/e2e/support/api-mock.ts`
- Test: `frontends/console/e2e/instances.spec.ts`

**Interfaces:**
- Consumes `GET /networks/vpcs` and `GET /networks/subnets`.
- Produces `CreateInstanceRequest.network`.

- [ ] Extend `InstanceFormState`:

```ts
vpc_id: string
subnet_id: string
private_ip: string
```

- [ ] Load VPCs/subnets with `useQuery`:

```ts
const vpcs = useQuery({
  queryKey: ['network-vpcs', 'select'],
  queryFn: () => listOrThrow(() => coreApi.GET('/networks/vpcs', { params: { query: { limit: 50 } } })),
})
const subnets = useQuery({
  queryKey: ['network-subnets', 'select'],
  queryFn: () => listOrThrow(() => coreApi.GET('/networks/subnets', { params: { query: { limit: 50 } } })),
})
```

- [ ] Add form items for container, gpu_container, sandbox, and vm:
  - VPC select
  - subnet select filtered by selected VPC
  - optional private IP using `Ipv4CidrInput` without prefix

- [ ] In `buildCreateInstanceBody`, add:

```ts
if (form.subnet_id) {
  body.network = {
    vpc_id: form.vpc_id || undefined,
    subnet_id: form.subnet_id,
    private_ip: form.private_ip || undefined,
  }
}
```

- [ ] Add frontend validation:
  - subnet cannot be selected before VPC
  - subnet options filtered by VPC
  - private IP, if set, must be inside selected subnet CIDR

- [ ] Update `frontends/console/e2e/support/api-mock.ts` so instance E2E has one available VPC and subnet.

- [ ] Add E2E expectation:

```text
open create container modal
select VPC prod-vpc
select subnet app-subnet
fill optional private IP 10.0.1.10
submit
expect POST /instances body.network.subnet_id == "subnet-1"
```

---

### Task 5: Real Cluster Verification

**Files:**
- No production file changes unless a bug is found
- Record results in the current sprint/development record

**Interfaces:**
- Consumes deployed backend/console.
- Produces proof that instance Pod/VM is on selected Kube-OVN subnet.

- [ ] Create or reuse VPC/subnet in Console:

```text
VPC: test, 10.72.0.0/24
Subnet: test-subnet, 10.72.0.0/25
Gateway: 10.72.0.1
```

- [ ] Create a container instance selecting `test-subnet`.

- [ ] Verify Pod annotation:

```bash
kubectl get pod -n ani-tenant-11111111-1111-1111-1111-111111111111 <pod-name> -o yaml
```

Expected:

```yaml
ovn.kubernetes.io/logical_switch: subnet-...
```

- [ ] Verify allocated IP:

```bash
kubectl get pod -n ani-tenant-11111111-1111-1111-1111-111111111111 <pod-name> -o wide
kubectl get ip | grep <pod-name>
```

Expected: Pod IP is inside selected subnet CIDR.

- [ ] Create two pods/instances in the same subnet and verify connectivity:

```bash
kubectl exec -n ani-tenant-11111111-1111-1111-1111-111111111111 <pod-a> -- ping -c 3 <pod-b-ip>
```

Expected: ping succeeds unless security policy blocks ICMP.

- [ ] Create a VM selecting the same subnet and verify its launcher pod/IP is inside the subnet.

---

### Task 6: Documentation And Development Record

**Files:**
- Modify: `frontends/console/docs/sprints/SPRINT-SCB-04-instances-compute.md`
- Modify if network-specific details changed: `frontends/console/docs/sprints/SPRINT-SCB-06-networks.md`

- [ ] Record:
  - API contract fields added
  - Console create-instance network controls added
  - backend annotation behavior
  - real cluster verification commands and result

- [ ] Run:

```bash
git diff --check -- frontends/console/docs/sprints/SPRINT-SCB-04-instances-compute.md frontends/console/docs/sprints/SPRINT-SCB-06-networks.md
```

Expected: no output.

---

## Recommended Execution Order

1. Task 1: OpenAPI contract first.
2. Task 2: backend validation/persistence.
3. Task 3: backend provider annotation.
4. Task 4: Console form.
5. Task 5: real cluster verification.
6. Task 6: development record.

Do not start Console form wiring before the backend accepts `network`; otherwise the UI can collect fields that do not actually attach the workload.
